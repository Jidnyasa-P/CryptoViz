import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Ensure Turbopack resolves the correct project root when workspace has multiple lockfiles
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
