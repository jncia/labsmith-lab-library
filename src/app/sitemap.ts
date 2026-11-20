import type { MetadataRoute } from "next";
import { getCatalog, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/client", "/start"].map((p) => ({ url: `${SITE_URL}${p || "/"}`, changeFrequency: "weekly" as const }));
  const labs = getCatalog().labs.map((lab) => ({
    url: `${SITE_URL}/labs/${lab.id}`,
    changeFrequency: "monthly" as const,
  }));
  return [...pages, ...labs];
}
