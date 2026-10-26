import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare/cloudflare-context";

// Local `next dev` gets the platform's D1 binding (DB) and auth dev vars
// resolved through the generated Freebuff wrangler config.
initOpenNextCloudflareForDev({ configPath: "./freebuff.wrangler.jsonc" });

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
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
