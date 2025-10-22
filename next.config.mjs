/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,

  // Enable experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // TypeScript configuration
  typescript: {
    // Enable strict mode for production builds
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Image optimization
  images: {
    domains: ["localhost"],
  },
};

export default nextConfig;
