import type { MetadataRoute } from "next";
import { labs } from "@/lib/labs";

const BASE_URL = "https://labsmith-lab-library.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...labs.map((lab) => ({
      url: `${BASE_URL}/labs/${lab.slug}`,
      lastModified: lab.verification.lastRun !== "unverified" ? lab.verification.lastRun : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
