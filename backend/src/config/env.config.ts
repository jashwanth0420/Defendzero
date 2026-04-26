import 'dotenv/config';
import { z } from 'zod';
import { logger } from '../utils/logger';

export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  FIREBASE_SERVICE_ACCOUNT: z.string().min(1).optional(),
  N8N_WEBHOOK_URL: z.string().url().optional(),
  RXNAV_TIMEOUT_MS: z.coerce.number().int().positive().default(4000),
  OPENFDA_TIMEOUT_MS: z.coerce.number().int().positive().default(4000),
  DAILYMED_TIMEOUT_MS: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

export type AppConfig = z.infer<typeof EnvSchema>;

const parseResult = EnvSchema.safeParse(process.env);

if (!parseResult.success) {
  logger.error('Invalid backend environment configuration', {
    issues: parseResult.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }))
  });
  throw new Error('Invalid backend environment configuration');
}

export const config: AppConfig = parseResult.data;
