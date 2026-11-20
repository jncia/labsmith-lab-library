/*
 * The publish gate: `npm run validate` (also the first step of `npm run build`).
 *
 * 1. Schema and honesty: loads the catalog with the same loader the site uses
 *    (src/lib/catalog.ts). A released lab needs its learner-read date and a
 *    hosted file; an in-review lab has no download; levels claim no more than
 *    the catalog holds; a development catalog never builds for production.
 * 2. Leak scan: every file the site is built from is scanned for the markers
 *    in src/lib/leak-markers.ts. This repository is public.
 *
 *   node scripts/validate-catalog.mts [--catalog <dir>] [--include-legacy]
 *
 * --include-legacy also scans the earlier content/labs and content/labpacks
 * folders, which the site no longer renders, and reports what it finds there
 * without failing.
 */
import fs from "node:fs";
import path from "node:path";
import { CatalogError, loadCatalog, resolveCatalogDir } from "../src/lib/catalog.ts";
import { scanText, type LeakFinding } from "../src/lib/leak-markers.ts";

// What the site is built from, relative to the repo root.
export const SCANNED = ["content/catalog", "content/dev-catalog", "src", "public", "scripts", "docs", ".github", "README.md", "next.config.ts", "package.json", "wrangler.jsonc"];
export const LEGACY = ["content/labs", "content/labpacks"];
// The two files that must spell the patterns out.
export const SCAN_EXEMPT = ["src/lib/leak-markers.ts", "scripts/validate-catalog.test.mts"];
const BINARY = /\.(?:ico|png|jpe?g|gif|webp|woff2?|ttf|otf|zip|pdf)$/i;

function walk(root: string, rel: string, out: string[]) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return;
  const st = fs.statSync(abs);
  if (st.isFile()) {
    out.push(rel);
    return;
  }
  for (const name of fs.readdirSync(abs)) {
    if (name === "node_modules" || name === ".next" || name === ".DS_Store") continue;
    walk(root, path.join(rel, name), out);
  }
}

export function scanFiles(root: string, entries: string[]): { file: string; finding: LeakFinding }[] {
  const files: string[] = [];
  for (const e of entries) walk(root, e, files);
  const hits: { file: string; finding: LeakFinding }[] = [];
  for (const file of files) {
    const normal = file.split(path.sep).join("/");
    if (SCAN_EXEMPT.includes(normal)) continue;
    if (BINARY.test(file)) continue;
    const text = fs.readFileSync(path.join(root, file), "utf8");
    for (const finding of scanText(text)) hits.push({ file: normal, finding });
  }
  return hits;
}

export function validate(root: string, catalogDir: string, opts: { production?: boolean } = {}) {
  const problems: string[] = [];
  let summary = "";
  try {
    const catalog = loadCatalog(catalogDir, { production: opts.production });
    const released = catalog.labs.filter((l) => l.release.status === "released").length;
    summary = `${catalog.kind} catalog ${path.relative(root, catalogDir) || "."}: ${catalog.labs.length} lab(s) listed, ${released} released`;
  } catch (e) {
    if (e instanceof CatalogError) problems.push(...e.problems);
    else throw e;
  }
  for (const { file, finding } of scanFiles(root, SCANNED)) {
    problems.push(`${file}:${finding.line}: ${finding.description} (${finding.marker}): ${finding.excerpt}`);
  }
  return { problems, summary };
}

function main(argv: string[]) {
  const root = process.cwd();
  let catalogDir = resolveCatalogDir();
  const i = argv.indexOf("--catalog");
  if (i >= 0 && argv[i + 1]) catalogDir = path.resolve(root, argv[i + 1]);
  const { problems, summary } = validate(root, catalogDir);
  if (argv.includes("--include-legacy")) {
    const legacy = scanFiles(root, LEGACY);
    console.log(`legacy folders (not rendered, not failing): ${legacy.length} marker hit(s)`);
    for (const { file, finding } of legacy) console.log(`  ${file}:${finding.line}: ${finding.marker}: ${finding.excerpt.slice(0, 100)}`);
  }
  if (problems.length) {
    console.error(`validate: ${problems.length} problem(s)`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`validate: ok. ${summary}; leak scan clean.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
