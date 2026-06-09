/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Pre-existing lint warnings in lib/ files don't block production builds.
    // Run `npx eslint .` separately to review them.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
