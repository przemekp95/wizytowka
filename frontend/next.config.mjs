/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
