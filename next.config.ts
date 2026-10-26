import type { NextConfig } from "next";

// Every page reads the signed-in user's data, so pages render per request.
// Cache Components is left off to keep data fetching simple.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
