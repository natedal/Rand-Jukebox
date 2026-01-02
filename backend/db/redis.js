import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient;

export async function initRedis() {
  // Support Upstash REST API format
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const upstashRestUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  // If Upstash REST credentials are provided, use REST API
  if (upstashRestUrl && upstashRestToken) {
    console.log('⚠️  Using Upstash REST API - some Redis features may be limited');
    // For now, fall back to TCP if available, otherwise we'll need to implement REST client
    // The standard redis client doesn't support REST API directly
  }
  
  redisClient = createClient({
    url: redisUrl,
    socket: {
      tls: redisUrl.startsWith('rediss://'), // Enable TLS for rediss:// URLs
      rejectUnauthorized: false, // Required for Upstash
    },
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis Client Connected');
  });

  await redisClient.connect();
  return redisClient;
}

export function getRedis() {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return redisClient;
}

// Helper functions for atomic operations
export async function atomicVote(songId, userIdentifier, venueId, voteType = 'upvote') {
  const redis = getRedis();
  const voteKey = `venue:${venueId}:vote:${songId}:${userIdentifier}`;
  const songUpvotesKey = `venue:${venueId}:song:${songId}:upvotes`;
  const songDownvotesKey = `venue:${venueId}:song:${songId}:downvotes`;

  // Check if already voted
  const exists = await redis.exists(voteKey);
  if (exists) {
    // Get existing vote type
    const existingVoteType = await redis.get(voteKey);
    if (existingVoteType === voteType) {
      throw new Error('Already voted on this song');
    }
    // User is changing vote type (upvote to downvote or vice versa)
    // Remove old vote count
    if (existingVoteType === 'upvote') {
      await redis.decr(songUpvotesKey);
    } else {
      await redis.decr(songDownvotesKey);
    }
  }

  // Atomic operation
  const multi = redis.multi();
  multi.set(voteKey, voteType, { EX: 86400 }); // 24 hour expiry
  if (voteType === 'upvote') {
    multi.incr(songUpvotesKey);
  } else {
    multi.incr(songDownvotesKey);
  }
  
  try {
    const results = await multi.exec();
    return results;
  } catch (error) {
    throw new Error('Failed to record vote');
  }
}

export async function atomicUnvote(songId, userIdentifier, venueId) {
  const redis = getRedis();
  const voteKey = `venue:${venueId}:vote:${songId}:${userIdentifier}`;
  const songUpvotesKey = `venue:${venueId}:song:${songId}:upvotes`;
  const songDownvotesKey = `venue:${venueId}:song:${songId}:downvotes`;

  const exists = await redis.exists(voteKey);
  if (!exists) {
    throw new Error('No vote to remove');
  }

  // Get vote type to decrement correct counter
  const voteType = await redis.get(voteKey);

  const multi = redis.multi();
  multi.del(voteKey);
  if (voteType === 'upvote') {
    multi.decr(songUpvotesKey);
  } else {
    multi.decr(songDownvotesKey);
  }
  
  try {
    const results = await multi.exec();
    return results;
  } catch (error) {
    throw new Error('Failed to remove vote');
  }
}

