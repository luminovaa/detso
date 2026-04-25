/**
 * Prisma Client Instance with PostgreSQL Adapter
 *
 * Prisma v7 requires a driver adapter for database connections.
 * We parse DATABASE_URL explicitly to ensure all connection
 * parameters (especially password) are passed as strings.
 *
 * NOTE: dotenv is loaded here because this module may be imported
 * before the main entry point calls dotenv.config() (due to
 * ESM import hoisting).
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;

// Parse the DATABASE_URL to extract individual connection parameters.
// This avoids issues where PrismaPg's internal pool may not correctly
// parse the connection string, causing "password must be a string" errors.
const url = new URL(connectionString);
const adapter = new PrismaPg({
  host: url.hostname,
  port: Number(url.port) || 5432,
  database: url.pathname.slice(1),
  user: url.username,
  password: url.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const prisma = new PrismaClient({ adapter });

export { prisma };