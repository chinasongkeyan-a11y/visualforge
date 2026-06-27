import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
  // Externalize native Node.js modules that can't be bundled by webpack/turbopack
  serverExternalPackages: [
    '@napi-rs/canvas',
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
