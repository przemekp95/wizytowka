import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true }, // jeśli używasz <Image/>
};
export default nextConfig;
