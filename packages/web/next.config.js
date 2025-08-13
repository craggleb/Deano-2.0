/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  async rewrites() {
    // Use the Docker service name for server-side rewrites
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'http://api:3001' 
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
