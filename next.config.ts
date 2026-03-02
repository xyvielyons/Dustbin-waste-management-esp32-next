import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env:{
    NEXT_PUBLIC_MAIN_LINK: 'https://edusomo.com'
  },
  eslint: {
      ignoreDuringBuilds: true,
  },
  typescript:{
      ignoreBuildErrors:true
  },

  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      
      {
        protocol: 'https',
        hostname: '**.google.com',
      },
      {
        protocol: 'https',
        hostname: '**.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.ufs.sh',
      },
      {
        protocol: 'https',
        hostname: '**.dicebear.com',
      },
    ],
  },
};

export default nextConfig;
