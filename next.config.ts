import type { NextConfig } from "next";
import { maxFileSizeMB } from "./lib/file-types";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // The extra 0.1 MB is room for the upload's form encoding.
      bodySizeLimit: `${maxFileSizeMB + 0.1}mb`,
    },
  },
  turbopack: {
    rules: {
      "*.md": { type: "text" },
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
