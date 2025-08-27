import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",       // ← ten tryb buduje server.js + minimalne node_modules
  images: { unoptimized: true } // opcjonalne, jeśli nie chcesz loadera obrazków
};

export default nextConfig;
