import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Required for Electron: loadFile() uses file:// so assets must be relative
  assetPrefix: ".",
};

export default nextConfig;
