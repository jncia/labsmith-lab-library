import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { loadCatalog } from "./src/lib/catalog.ts";
import { downloadRedirects, headerRules } from "./src/lib/hosting.ts";
import { INDEXABLE } from "./src/lib/indexing.ts";

// A build is a static export (the `out` folder) that Cloudflare serves; see
// wrangler.jsonc. A static export cannot carry redirects or headers, so the
// build writes them into `out/_redirects` and `out/_headers`
// (scripts/write-hosting-files.mts). The dev server gets the same rules here,
// from the same list in src/lib/hosting.ts.
export default function config(phase: string): NextConfig {
  if (phase !== PHASE_DEVELOPMENT_SERVER) return { output: "export" };
  return {
    async headers() {
      return headerRules(INDEXABLE);
    },
    async redirects() {
      return downloadRedirects(loadCatalog()).map((r) => ({ ...r, permanent: false }));
    },
  };
}
