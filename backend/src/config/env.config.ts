import { z } from 'zod';

// Utility to parse strictly
export const EnvSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string().optional(),
});

// Force parse (will crash the server to prevent dirty boot)
export const config = EnvSchema.parse(process.env);
