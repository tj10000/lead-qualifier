/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@trigger.dev/sdk"],
  },
};

export default nextConfig;
