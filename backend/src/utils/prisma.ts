/**
 * Prisma Client Instance with PostgreSQL Adapter (pg)
 *
 * PURPOSE:
 * - Uses `@prisma/adapter-pg` for full control over database connections.
 * - Enables connection pooling via `pg` (Node.js PostgreSQL client).
 * - Supports deployment in environments requiring manual connection management
 *   (e.g., serverless with warm containers, or custom connection handling).
 *
 * WHY USE THE ADAPTER:
 * - Prisma uses internal connections by default.
 * - With `PrismaPg`, we can:
 *   ✅ Integrate with external connection pool (`pg.Pool`)
 *   ✅ Configure idle timeout, max connections, etc. via `pg` config
 *   ✅ Avoid connection issues on platforms like Vercel/Cloudflare
 *      that limit direct database connections.
 *
 * SECURITY NOTES:
 * - `DATABASE_URL` MUST be set in environment variables.
 * - Never hardcode credentials in the code!
 *
 * REFERENCE:
 * - Adapter Docs: https://pris.ly/d/adapter-pg
 * - pg Pool Docs: https://node-postgres.com/apis/pool
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Database connection string for PostgreSQL.
 * Retrieved from environment variable `DATABASE_URL`.
 * Format example: "postgresql://user:pass@host:port/dbname"
 *
 * ⚠️ Must be available at runtime — application will crash if missing.
 */
const connectionString = process.env.DATABASE_URL!;

/**
 * PostgreSQL connection pool using the `pg` library.
 *
 * CONFIGURATION:
 * - `max`: Maximum number of concurrent connections (default pg: 10)
 * - `idleTimeoutMillis`: Close idle connections after 30 seconds
 * - `connectionTimeoutMillis`: Fail if connection takes longer than 10 seconds
 *
 * These settings can be adjusted based on deployment environment
 * and expected traffic volume.
 */
const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

/**
 * Prisma adapter for PostgreSQL using `pg.Pool`.
 * Connects Prisma Client to the external connection pool.
 * 
 * This adapter acts as a bridge between Prisma's query engine
 * and the PostgreSQL connection pool, ensuring all database
 * operations use pooled connections.
 */
const adapter = new PrismaPg(pool);

/**
 * Main Prisma Client instance.
 *
 * Configured to use the PostgreSQL adapter (`PrismaPg`),
 * ensuring all queries use connections from `pg.Pool`.
 *
 * 🔄 Reusable: Export a single instance for the entire application.
 * (Singleton pattern — safe for server environment)
 * 
 * BENEFITS:
 * - Centralized database connection management
 * - Consistent configuration across all queries
 * - Efficient connection pooling
 * - Better performance under load
 * 
 * USAGE:
 * Import this instance anywhere in the application:
 * ```ts
 * import { prisma } from './utils/prisma';
 * 
 * const users = await prisma.user.findMany();
 * ```
 */
const prisma = new PrismaClient({ adapter });

export { prisma };