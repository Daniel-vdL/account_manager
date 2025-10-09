import type { Config } from 'drizzle-kit';

export default {
  schema: './app/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://account_manager:SecureP@ssw0rd2024!@localhost:5432/account_manager',
  },
  verbose: true,
  strict: true,
} satisfies Config;