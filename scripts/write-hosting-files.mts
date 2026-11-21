/*
 * Writes `out/_redirects` and `out/_headers` after `next build`, from the same
 * rules the dev server uses (src/lib/hosting.ts). Cloudflare reads both files
 * from the assets folder and does not serve them as pages.
 *
 * Run by `npm run build`; reads the catalog the build used (CATALOG_DIR or
 * content/catalog), so a production build with a development catalog is
 * refused here as it is in the build.
 */
import fs from "node:fs";
import path from "node:path";
import { loadCatalog } from "../src/lib/catalog.ts";
import {
  downloadRedirects,
  headerRules,
  NO_LABS_PLACEHOLDER,
  renderHeadersFile,
  renderRedirectsFile,
} from "../src/lib/hosting.ts";
import { INDEXABLE } from "../src/lib/indexing.ts";

/** Deletes the empty-catalog placeholder lab page (see NO_LABS_PLACEHOLDER) and its data files. */
function removePlaceholder(outDir: string) {
  const labsDir = path.join(outDir, "labs");
  if (!fs.existsSync(labsDir)) return;
  for (const name of fs.readdirSync(labsDir)) {
    if (name === NO_LABS_PLACEHOLDER || name.startsWith(`${NO_LABS_PLACEHOLDER}.`)) {
      fs.rmSync(path.join(labsDir, name), { recursive: true, force: true });
    }
  }
}

export function writeHostingFiles(outDir: string): { redirects: number; noindex: boolean } {
  if (!fs.existsSync(path.join(outDir, "index.html"))) {
    throw new Error(`${outDir}/index.html not found: run next build first`);
  }
  const catalog = loadCatalog();
  if (catalog.labs.length === 0) removePlaceholder(outDir);
  const routes = downloadRedirects(catalog);
  const rules = headerRules(INDEXABLE);
  fs.writeFileSync(path.join(outDir, "_redirects"), renderRedirectsFile(routes));
  fs.writeFileSync(path.join(outDir, "_headers"), renderHeadersFile(rules));
  return { redirects: routes.length, noindex: rules.length > 0 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = writeHostingFiles(path.resolve(process.cwd(), "out"));
  console.log(`hosting files: ${result.redirects} download redirect(s), noindex ${result.noindex ? "on" : "off"}`);
}
