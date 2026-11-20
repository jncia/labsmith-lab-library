import { cache } from "react";
import { loadCatalog } from "@/lib/catalog";

/** The address the site is served from, for metadata and the sitemap. */
export const SITE_URL = (process.env.SITE_URL || "https://labsmith-lab-library.vercel.app").replace(/\/$/, "");

export const SITE_NAME = "LabPack";

export { INDEXABLE, IS_PRODUCTION } from "@/lib/indexing";

/** The catalog, loaded once per build. A malformed catalog throws and fails the build. */
export const getCatalog = cache(() => loadCatalog());

/** The stable address a download is reached by. next.config.ts sends it on to the host. */
export function downloadPath(kind: "client" | "lab", id?: string) {
  return kind === "client" ? "/download/client" : `/download/labs/${id}`;
}
