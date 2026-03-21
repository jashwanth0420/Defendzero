import Redis from 'ioredis';
import { config } from './env.config';

// Singleton Redis Client matching db.client pattern
const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis || new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

redis.on('connect', () => console.log('✅ Connected to Redis successfully.'));
redis.on('error', (err) => console.error('❌ Redis Connection Error:', err));

if (config.NODE_ENV !== 'production') globalForRedis.redis = redis;
