import 'dotenv/config';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('[Redis] REDIS_URL is missing. Queue and worker features are disabled.');
}

export const redisConnection = redisUrl
  ? new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      tls: {},
    })
  : null;

redisConnection?.on('connect', () => {
  console.log('[Redis] Connected.');
});

redisConnection?.on('ready', () => {
  console.log('[Redis] Ready for commands.');
});

redisConnection?.on('error', (error: Error) => {
  console.error('[Redis] Connection error:', error.message);
});

redisConnection?.on('close', () => {
  console.warn('[Redis] Connection closed.');
});

export const isRedisConfigured = Boolean(redisUrl);
