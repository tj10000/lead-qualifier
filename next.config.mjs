/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@trigger.dev/sdk", "@trigger.dev/core", "stripe"],
  },
};

export default nextConfig;
