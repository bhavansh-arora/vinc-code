import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
];

const nextConfig: NextConfig = {
  output: 'standalone', // small self-contained server for the Docker image
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Recorded voice clips are named after their text, so a changed line gets a new file.
      { source: '/voice/:file([a-z0-9]+\\.mp3)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }
    ];
  },
  async rewrites() {
    return [
      { source: '/game', destination: '/game/index.html' },
      // /login and /signup are one page, so switching tabs and signing up never swaps the page out.
      { source: '/signup', destination: '/login?tab=signup' }
    ];
  }
};

export default nextConfig;
