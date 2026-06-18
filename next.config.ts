import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray lockfile exists higher up
  // in the home dir, which would otherwise be inferred as the root).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
