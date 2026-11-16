#!/usr/bin/env bash
# Run once from the repo root after unzipping the changes over your project.
rm -rf "app/(dashboard)" prisma/generated migrations/snapshots .next
rm -f middleware.ts lib/prisma.ts prisma/schema.prisma components/ThemeProvider.tsx
echo "Old files removed. Now run: npm install"
