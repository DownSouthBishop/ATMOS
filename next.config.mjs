/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'prisma', '@prisma/client'];
    return config;
  },
};

export default nextConfig;
