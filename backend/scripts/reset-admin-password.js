import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase, getPool } from '../db/index.js';
import { getVenueId } from '../utils/queue.js';
import bcrypt from 'bcrypt';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function resetAdminPassword() {
  try {
    // Initialize database connection
    await initDatabase();
    
    const venueSlug = process.env.VENUE_SLUG || 'rand';
    const venueId = await getVenueId(venueSlug);
    const adminPassword = process.env.ADMIN_PASSWORD || 'randstaff';
    
    console.log(`Resetting admin password for venue: ${venueSlug}`);
    console.log(`New password: ${adminPassword}`);
    
    // Hash the new password
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    
    // Update the password hash
    const pool = getPool();
    const result = await pool.query(
      'UPDATE admin_settings SET admin_password_hash = $1 WHERE venue_id = $2 RETURNING id',
      [adminPasswordHash, venueId]
    );
    
    if (result.rows.length === 0) {
      // If no admin_settings exists, create it
      await pool.query(
        'INSERT INTO admin_settings (venue_id, admin_password_hash) VALUES ($1, $2)',
        [venueId, adminPasswordHash]
      );
      console.log('✅ Created admin settings with new password');
    } else {
      console.log('✅ Updated admin password successfully');
    }
    
    console.log('\nYou can now log in with password:', adminPassword);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetAdminPassword();



