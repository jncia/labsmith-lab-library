import type { NextConfig } from "next";
import { loadCatalog } from "./src/lib/catalog.ts";

// Downloads are reached by stable site addresses (/download/client and
// /download/labs/<id>) and sent on to wherever the file is hosted, so the
// host can change without changing a link. Only hosted files get a route.
const nextConfig: NextConfig = {
  async redirects() {
    const catalog = loadCatalog();
    const routes = [];
    if (catalog.client.url) {
      routes.push({ source: "/download/client", destination: catalog.client.url, permanent: false });
    }
    for (const lab of catalog.labs) {
      if (lab.release.status === "released" && lab.release.download) {
        routes.push({ source: `/download/labs/${lab.id}`, destination: lab.release.download.url, permanent: false });
      }
    }
    return routes;
  },
};

export default nextConfig;
