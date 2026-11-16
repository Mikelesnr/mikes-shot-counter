import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // bcryptjs is pure JS, but keeping it external avoids bundling quirks in serverless functions.
  serverExternalPackages: ['bcryptjs'],
};

export default nextConfig;
