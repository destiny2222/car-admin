import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/admin/:path*',
  //       destination: 'https://aria-app-9boes.ondigitalocean.app/api/admin/:path*',
  //     },
  //   ];
  // },
};

export default nextConfig;
