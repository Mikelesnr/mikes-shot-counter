# Upgrade notes: Prisma 8, proxy, role security, mobile UI

## Delete these from the repo
- middleware.ts (replaced by proxy.ts)
- lib/prisma.ts
- prisma/schema.prisma and the whole prisma/generated folder
- app/(dashboard) folder (the admin page now lives at app/admin/page.tsx)
- components/ThemeProvider.tsx
- migrations/snapshots (old Prisma 8 attempt)

## Install
Replace package.json and package-lock.json, then run npm install.

## Environment variables (local .env and Netlify site settings)
- DATABASE_URL  your Postgres connection string
- SESSION_SECRET  random string, 32+ characters (for example: openssl rand -base64 48)
- ADMIN_PASSWORD  only needed when you run the seed (npm run db:seed)

## Database
Prisma 8 only supports PostgreSQL, which you already use.
1. npx prisma contract emit
2. Back up the database first.
3. Run npx prisma db update --dry-run and read the plan.
4. Run npx prisma db update.
The plan adds Shop.ownerId, and Prisma 8 stores timestamps as timestamptz instead of timestamp. Existing rows keep their data.
Shops created before this change have no owner. To assign one, run something like:
UPDATE "Shop" SET "ownerId" = '<owner user id>' WHERE "ownerId" IS NULL;

## Access rules now enforced (proxy.ts and every API route)
- /counter: any signed-in role
- /owner: Owner only, /manager: Manager only, /admin: Admin only
- Wrong role is redirected to their own home page. Not signed in goes to /login.
- /owner/register stays public.
- Sessions are signed (HS256) cookies, so they cannot be edited by hand.

## Deploying to Netlify or Vercel
Set these environment variables for the production environment (and for Functions/runtime, not only Build):
- DATABASE_URL  for Supabase use the POOLER string (Project Settings > Database > Connection pooling), the transaction pooler on port 6543. Do not use the "direct connection" host (db.xxxx.supabase.co): it is IPv6 only and Netlify/Vercel cannot reach it.
- SESSION_SECRET  32+ random characters. Without it every login fails with a 500 in production.
- Redeploy after changing environment variables.

After deploying, open /api/health on your site. It tells you which of the above is wrong, without showing any secret values.
Run `npx prisma db update` once against the Supabase database using the DIRECT or session pooler string (migrations need a normal connection, so run it from your computer with DATABASE_URL pointed at it).
