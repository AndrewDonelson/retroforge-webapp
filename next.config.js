/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable Turbopack due to parser bug with forward slashes in JSX
  // See: TURBOPACK_BUG_ANALYSIS.md for details
  // Note: Turbopack is disabled by default in Next.js 16 unless explicitly enabled
  // Configure Turbopack for Next.js 16 (currently disabled)
  turbopack: {
    rules: {
      '*.wasm': {
        loaders: ['file-loader'],
        as: '*.wasm',
      },
    },
  },
  // Remove static export for development
  // output: 'export',
  // trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Headers for WASM files (only for production builds)
  async headers() {
    return [
      {
        source: '/wasm/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
