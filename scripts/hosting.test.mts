/*
 * The hosting rules: download redirects only for hosted files, noindex while
 * the site is not indexable, and the Cloudflare file formats. Run with
 * `npm test`. Everything here is invented.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { Catalog } from "../src/lib/catalog.ts";
import { downloadRedirects, headerRules, renderHeadersFile, renderRedirectsFile } from "../src/lib/hosting.ts";
import { writeHostingFiles } from "./write-hosting-files.mts";

const download = (url: string) => ({ url, fileName: "x.labpack", bytes: 1, sha256: "0".repeat(64) });

function catalog(clientUrl: string | null, labs: { id: string; status: "in-review" | "released"; url?: string }[]): Catalog {
  return {
    client: { url: clientUrl },
    labs: labs.map((l) => ({ id: l.id, release: { status: l.status, download: l.url ? download(l.url) : null } })),
  } as unknown as Catalog;
}

test("only hosted files get a download redirect", () => {
  const routes = downloadRedirects(
    catalog("https://files.example.com/client.zip", [
      { id: "released-hosted", status: "released", url: "https://files.example.com/a.labpack" },
      { id: "released-unhosted", status: "released" },
      { id: "in-review-hosted", status: "in-review", url: "https://files.example.com/b.labpack" },
    ]),
  );
  assert.deepEqual(routes, [
    { source: "/download/client", destination: "https://files.example.com/client.zip" },
    { source: "/download/labs/released-hosted", destination: "https://files.example.com/a.labpack" },
  ]);
  assert.deepEqual(downloadRedirects(catalog(null, [])), []);
});

test("_redirects lines are temporary redirects", () => {
  const text = renderRedirectsFile([{ source: "/download/client", destination: "https://files.example.com/c.zip" }]);
  assert.match(text, /^\/download\/client https:\/\/files\.example\.com\/c\.zip 302$/m);
  assert.equal(renderRedirectsFile([]).trim().split("\n").filter((l) => !l.startsWith("#")).length, 0);
});

test("noindex on every path until the site is indexable", () => {
  assert.deepEqual(headerRules(true), []);
  const text = renderHeadersFile(headerRules(false));
  assert.match(text, /^\/\*\n {2}X-Robots-Tag: noindex, nofollow$/m);
  assert.equal(renderHeadersFile(headerRules(true)).trim().split("\n").filter((l) => !l.startsWith("#")).length, 0);
});

test("hosting files are written only after a build", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "hosting-out-"));
  assert.throws(() => writeHostingFiles(out), /run next build first/);
  fs.writeFileSync(path.join(out, "index.html"), "<html></html>");
  const result = writeHostingFiles(out);
  assert.equal(result.noindex, true);
  assert.ok(fs.existsSync(path.join(out, "_redirects")));
  assert.match(fs.readFileSync(path.join(out, "_headers"), "utf8"), /X-Robots-Tag: noindex, nofollow/);
});
