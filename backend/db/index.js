import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool;

export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase') || process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
  });

  // Test connection
  const client = await pool.connect();
  client.release();

  // Run migrations
  await runMigrations();

  return pool;
}

export function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
}

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create venues table
    await client.query(`
      CREATE TABLE IF NOT EXISTS venues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create songs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
        spotify_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        album_art_url TEXT,
        duration_ms INTEGER,
        is_explicit BOOLEAN DEFAULT FALSE,
        requested_at TIMESTAMP DEFAULT NOW(),
        requested_by VARCHAR(255),
        status VARCHAR(20) DEFAULT 'queued',
        played_at TIMESTAMP,
        admin_priority INTEGER DEFAULT NULL,
        approval_status VARCHAR(20) DEFAULT 'pending',
        audio_features JSONB,
        denied_at TIMESTAMP,
        denied_reason TEXT,
        CONSTRAINT valid_status CHECK (status IN ('pending', 'queued', 'playing', 'played', 'skipped')),
        CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'denied'))
      )
    `);

    // Create votes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
        user_identifier VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(song_id, user_identifier)
      )
    `);

    // Create user_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
        user_identifier VARCHAR(255) NOT NULL,
        song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
        requested_at TIMESTAMP DEFAULT NOW(),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        UNIQUE(venue_id, user_identifier, date, song_id)
      )
    `);

    // Create admin_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venue_id UUID REFERENCES venues(id) UNIQUE,
        admin_password_hash VARCHAR(255) NOT NULL,
        default_playlist_id VARCHAR(255),
        is_playing BOOLEAN DEFAULT FALSE,
        is_queue_enabled BOOLEAN DEFAULT TRUE,
        current_song_id UUID REFERENCES songs(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        filter_mode VARCHAR(20) DEFAULT 'free',
        ban_explicit BOOLEAN DEFAULT FALSE,
        genre_filter VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
        playlist_id VARCHAR(255),
        playlist_name VARCHAR(255)
      )
    `);

    // Create playback_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS playback_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
        song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
        played_at TIMESTAMP DEFAULT NOW(),
        duration_played_ms INTEGER,
        was_skipped BOOLEAN DEFAULT FALSE
      )
    `);

    // Create allowed_playlist_tracks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS allowed_playlist_tracks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
        spotify_id VARCHAR(255) NOT NULL,
        playlist_id VARCHAR(255) NOT NULL,
        added_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(venue_id, spotify_id, playlist_id)
      )
    `);

    // Create song_feedback table
    await client.query(`
      CREATE TABLE IF NOT EXISTS song_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
        venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
        user_identifier VARCHAR(255) NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add admin_priority column if it doesn't exist (migration)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='songs' AND column_name='admin_priority'
        ) THEN
          ALTER TABLE songs ADD COLUMN admin_priority INTEGER DEFAULT NULL;
        END IF;
      END $$;
    `);

    // Add selected_device_id column if it doesn't exist (migration)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='admin_settings' AND column_name='selected_device_id'
        ) THEN
          ALTER TABLE admin_settings ADD COLUMN selected_device_id VARCHAR(255) DEFAULT NULL;
        END IF;
      END $$;
    `);

    // Add spotify_refresh_token column if it doesn't exist (migration)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='admin_settings' AND column_name='spotify_refresh_token'
        ) THEN
          ALTER TABLE admin_settings ADD COLUMN spotify_refresh_token VARCHAR(500) DEFAULT NULL;
        END IF;
      END $$;
    `);

    // Add approval_status and audio_features columns if they don't exist (migration)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='songs' AND column_name='approval_status'
        ) THEN
          ALTER TABLE songs ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending';
          ALTER TABLE songs ADD CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'denied'));
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='songs' AND column_name='audio_features'
        ) THEN
          ALTER TABLE songs ADD COLUMN audio_features JSONB;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='songs' AND column_name='denied_at'
        ) THEN
          ALTER TABLE songs ADD COLUMN denied_at TIMESTAMP;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='songs' AND column_name='denied_reason'
        ) THEN
          ALTER TABLE songs ADD COLUMN denied_reason TEXT;
        END IF;
        
        -- Update valid_status constraint to include 'pending'
        ALTER TABLE songs DROP CONSTRAINT IF EXISTS valid_status;
        ALTER TABLE songs ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'queued', 'playing', 'played', 'skipped'));
      END $$;
    `);

    // Add filter columns to admin_settings if they don't exist (migration)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='admin_settings' AND column_name='filter_mode'
        ) THEN
          ALTER TABLE admin_settings ADD COLUMN filter_mode VARCHAR(20) DEFAULT 'free';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='admin_settings' AND column_name='ban_explicit'
        ) THEN
          ALTER TABLE admin_settings ADD COLUMN ban_explicit BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='admin_settings' AND column_name='genre_filter'
        ) THEN
          ALTER TABLE admin_settings ADD COLUMN genre_filter VARCHAR[] DEFAULT ARRAY[]::VARCHAR[];
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='admin_settings' AND column_name='playlist_id'
        ) THEN
          ALTER TABLE admin_settings ADD COLUMN playlist_id VARCHAR(255);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='admin_settings' AND column_name='playlist_name'
        ) THEN
          ALTER TABLE admin_settings ADD COLUMN playlist_name VARCHAR(255);
        END IF;
      END $$;
    `);

    // Add vote_type column to votes table if it doesn't exist (migration)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='votes' AND column_name='vote_type'
        ) THEN
          ALTER TABLE votes ADD COLUMN vote_type VARCHAR(10) DEFAULT 'upvote';
          ALTER TABLE votes ADD CONSTRAINT valid_vote_type CHECK (vote_type IN ('upvote', 'downvote'));
          UPDATE votes SET vote_type = 'upvote' WHERE vote_type IS NULL;
        END IF;
      END $$;
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_songs_venue_status ON songs(venue_id, status);
      CREATE INDEX IF NOT EXISTS idx_songs_requested_at ON songs(requested_at DESC);
      CREATE INDEX IF NOT EXISTS idx_songs_admin_priority ON songs(admin_priority DESC NULLS LAST);
      CREATE INDEX IF NOT EXISTS idx_songs_approval_status ON songs(venue_id, approval_status);
      CREATE INDEX IF NOT EXISTS idx_votes_song_id ON votes(song_id);
      CREATE INDEX IF NOT EXISTS idx_votes_vote_type ON votes(vote_type);
      CREATE INDEX IF NOT EXISTS idx_user_requests_venue_date ON user_requests(venue_id, user_identifier, date);
      CREATE INDEX IF NOT EXISTS idx_playback_history_venue ON playback_history(venue_id, played_at DESC);
      CREATE INDEX IF NOT EXISTS idx_allowed_playlist_tracks_venue_spotify ON allowed_playlist_tracks(venue_id, spotify_id);
      CREATE INDEX IF NOT EXISTS idx_song_feedback_song ON song_feedback(song_id);
      CREATE INDEX IF NOT EXISTS idx_song_feedback_venue ON song_feedback(venue_id);
      CREATE INDEX IF NOT EXISTS idx_song_feedback_user ON song_feedback(user_identifier);
    `);

    // Seed venues
    const venues = [
      { slug: 'rand', name: 'Rand Dining Hall' },
      { slug: 'cafemogador', name: 'Cafe Mogador' },
      { slug: 'veselka', name: 'Veselka' },
      { slug: 'viacarota', name: 'Via Carota' },
      { slug: 'barpisellino', name: 'Bar Pisellino' },
      { slug: 'thecommerceinn', name: 'The Commerce Inn' },
      { slug: 'kopitiam', name: 'Kopitiam' }
    ];

    const bcrypt = await import('bcrypt');
    const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'randstaff';

    for (const venue of venues) {
      const venueResult = await client.query(
        'SELECT id FROM venues WHERE slug = $1',
        [venue.slug]
      );

      if (venueResult.rows.length === 0) {
        const venueInsert = await client.query(
          'INSERT INTO venues (slug, name) VALUES ($1, $2) RETURNING id',
          [venue.slug, venue.name]
        );
        const venueId = venueInsert.rows[0].id;

        // Initialize admin settings
        const adminPassword = process.env.ADMIN_PASSWORD || defaultAdminPassword;
        const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

        await client.query(
          `INSERT INTO admin_settings (venue_id, admin_password_hash) 
           VALUES ($1, $2)`,
          [venueId, adminPasswordHash]
        );

        console.log(`✅ Initialized venue: ${venue.name} (${venue.slug})`);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database migrations completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

