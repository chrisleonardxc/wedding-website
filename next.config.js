/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/serve-file/:path*',
      },
    ];
  },
}

module.exports = nextConfig