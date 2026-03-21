import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const ENABLE_QUEUE = process.env.ENABLE_QUEUE === 'true';

let redis: Redis | null = null;
let isRedisConnected = false;

if (ENABLE_QUEUE) {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      retryStrategy: (times) => {
        if (times > 3) {
           console.warn('⚠️ Redis connection failed multiple times. Disabling queue features.');
           return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      }
    });

    redis.on('connect', () => {
      isRedisConnected = true;
      console.log('✅ Redis connected successfully.');
    });

    redis.on('error', (err) => {
      isRedisConnected = false;
      console.warn('⚠️ Redis connection error:', err.message);
    });
  } catch (error) {
    console.warn('⚠️ Failed to initialize Redis client:', error);
  }
} else {
  console.log('ℹ️ Redis is disabled via ENABLE_QUEUE flag.');
}

export { redis, isRedisConnected, ENABLE_QUEUE };
