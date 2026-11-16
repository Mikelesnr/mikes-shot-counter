import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../src/prisma/db';

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'mike@mikeshotcounter.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error('Set ADMIN_PASSWORD (8+ characters) before seeding. There is no default password any more.');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const existing = await db.orm.public.User.where({ email: adminEmail }).first();

  const admin = existing
    ? await db.orm.public.User.where({ id: existing.id }).update({ passwordHash, role: 'ADMIN' })
    : await db.orm.public.User.create({ email: adminEmail, name: 'Mike (System Admin)', passwordHash, role: 'ADMIN' });

  console.log('Seeded admin account:', admin?.email);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exitCode = 1;
  })
  .finally(() => db.close());
