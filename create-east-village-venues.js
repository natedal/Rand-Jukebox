/**
 * Script to create venues for East Village bars
 * Run with: BACKEND_URL=your_url ADMIN_PASSWORD=your_password node create-east-village-venues.js
 * Or set environment variables in your shell first
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://rand-jukebox-production.up.railway.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// East Village bars with their venue configurations
const bars = [
  {
    slug: 'ninetyseven',
    name: "Ninety Seven",
    description: "A cozy neighborhood bar with craft cocktails and a welcoming vibe",
    address: "97 Avenue A, New York, NY 10009",
    vibe: "intimate craft cocktail bar with a loyal local following"
  },
  {
    slug: "sophies",
    name: "Sophie's Bar",
    description: "Legendary dive bar with strong drinks and an eclectic crowd",
    address: "507 E 5th St, New York, NY 10009",
    vibe: "iconic dive bar known for its unpretentious atmosphere and creative community"
  },
  {
    slug: "josiesbar",
    name: "Josie's Bar",
    description: "Classic East Village dive with pool tables and jukebox",
    address: "108 Avenue A, New York, NY 10009",
    vibe: "laid-back dive bar where regulars and newcomers mix over pool and music"
  },
  {
    slug: "bua",
    name: "Bua Bar",
    description: "Thai-inspired bar with creative cocktails and vibrant energy",
    address: "122 St Marks Pl, New York, NY 10009",
    vibe: "lively spot blending Thai flavors with East Village nightlife"
  },
  {
    slug: "thesaintnyc",
    name: "The Saint",
    description: "Rock bar with live music and a rebellious spirit",
    address: "105 Avenue A, New York, NY 10009",
    vibe: "rock-and-roll haven with live performances and a passionate music crowd"
  }
];

async function loginAsAdmin() {
  console.log('🔐 Logging in as admin...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/admin/login`, {
      password: ADMIN_PASSWORD,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Venue-Slug': 'rand',
      },
    });

    console.log('✅ Logged in successfully');
    return response.data.token;
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.error || error.message}`);
  }
}

async function createVenue(token, bar) {
  console.log(`\n🏗️  Creating venue: ${bar.name} (${bar.slug})...`);
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/admin/venues`, {
      slug: bar.slug,
      name: bar.name,
      admin_password: `${bar.slug}2026!`, // Secure password pattern
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Venue-Slug': 'rand',
      },
    });

    console.log(`✅ Created venue: ${bar.name}`);
    console.log(`   URL: https://${bar.slug}.jukeb.ink`);
    console.log(`   Admin password: ${bar.slug}2026!`);
    
    return { ...bar, ...response.data.venue };
  } catch (error) {
    if (error.response?.data?.error?.includes('already exists')) {
      console.log(`⚠️  Venue ${bar.slug} already exists, skipping...`);
      return { exists: true, ...bar };
    }
    throw new Error(`Failed to create venue: ${error.response?.data?.error || error.message}`);
  }
}

async function main() {
  try {
    console.log('🎵 Creating East Village Bar Venues\n');
    console.log(`Backend URL: ${BACKEND_URL}\n`);

    if (!ADMIN_PASSWORD) {
      console.error('❌ Error: ADMIN_PASSWORD environment variable is required');
      console.log('\nUsage: ADMIN_PASSWORD=your_password node create-east-village-venues.js');
      process.exit(1);
    }

    const token = await loginAsAdmin();
    
    const createdVenues = [];
    for (const bar of bars) {
      const venue = await createVenue(token, bar);
      createdVenues.push(venue);
    }

    console.log('\n\n✨ All venues created successfully!\n');
    console.log('📧 Venue URLs and Admin Credentials:\n');
    
    createdVenues.forEach(venue => {
      console.log(`${venue.name}:`);
      console.log(`  URL: https://${venue.slug}.jukeb.ink`);
      console.log(`  Admin: https://${venue.slug}.jukeb.ink/admin`);
      console.log(`  Password: ${venue.slug}2026!`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

