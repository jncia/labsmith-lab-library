import type { MetadataRoute } from "next";
import { INDEXABLE, SITE_URL } from "@/lib/site";

// Built once into the static export.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // Previews, local builds, and production until indexing is opened (src/lib/indexing.ts).
  if (!INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_URL}/sitemap.xml` };
}
