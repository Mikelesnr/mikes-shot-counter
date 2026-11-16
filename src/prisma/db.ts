import pg from 'pg';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const contract = contractFromJson<Contract>(contractJson);

type Db = ReturnType<typeof createDb>;

/**
 * We hand Prisma our own `pg` pool instead of a bare URL. Prisma's built-in connection sends extra
 * startup options that connection poolers (Supabase pooler, PgBouncer) reject, which breaks every
 * query on Netlify and Vercel. A plain pool works everywhere.
 */
function createPool(): pg.Pool {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL is not set. Add it to .env locally, or to your Netlify/Vercel environment variables.');
  }

  const url = new URL(raw);
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  const sslMode = url.searchParams.get('sslmode');
  // pg lets the URL's sslmode override our ssl setting, so we decide here and strip it.
  url.searchParams.delete('sslmode');
  url.searchParams.delete('pgbouncer');
  url.searchParams.delete('connection_limit');

  const useSsl = sslMode ? sslMode !== 'disable' : !isLocal;

  return new pg.Pool({
    connectionString: url.toString(),
    // Hosted Postgres (Supabase, Neon, ...) needs TLS; their certificate chains are not in Node's trust store.
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    // Each serverless instance handles one request at a time, so one connection each is plenty
    // and keeps you under the pooler's client limit.
    max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : isLocal ? 10 : 1,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 10_000,
  });
}

function createDb() {
  // The cast only bridges two copies of the pg type definitions; at runtime it is the same kind of Pool.
  return postgres({ contract, pg: createPool() as never, log: console });
}

// One client per server instance. In dev, hot reloads would otherwise leak a pool each time.
const globalForDb = globalThis as unknown as { __mscDb?: Db };

export const db: Db = globalForDb.__mscDb ?? (globalForDb.__mscDb = createDb());
