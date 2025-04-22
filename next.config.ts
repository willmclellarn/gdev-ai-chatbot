import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    serverActions: {
      bodySizeLimit: "10mb",
    },
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  devIndicators: {
    buildActivityPosition: "bottom-right",
    buildActivity: false,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './',
    };
    return config;
  },
};

export default nextConfig;
