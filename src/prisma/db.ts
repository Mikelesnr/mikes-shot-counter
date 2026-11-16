import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const contract = contractFromJson<Contract>(contractJson);

type Db = ReturnType<typeof createDb>;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add it to .env locally or to your Netlify site environment variables.');
  }
  return postgres({
    contract,
    url,
    poolOptions: { connectionTimeoutMillis: 20_000, idleTimeoutMillis: 10_000 },
  });
}

// One client per server instance. In dev, hot reloads would otherwise leak a pool each time.
const globalForDb = globalThis as unknown as { __mscDb?: Db };

export const db: Db = globalForDb.__mscDb ?? (globalForDb.__mscDb = createDb());
