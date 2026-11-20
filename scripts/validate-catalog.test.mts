/*
 * Self-test of the publish gate: every rule is shown to fire on a planted
 * violation, and a clean catalog passes. Run with `npm test`.
 *
 * This file spells leak patterns out on purpose, so the leak scan skips it
 * (see SCAN_EXEMPT). Everything here is invented: no real lab, host or person.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import YAML from "yaml";
import { CatalogError, loadCatalog } from "../src/lib/catalog.ts";
import { LEAK_MARKERS, scanText } from "../src/lib/leak-markers.ts";
import { extract, splitSummary } from "./extract-lab-metadata.mts";
import { scanFiles, validate } from "./validate-catalog.mts";

const LAB = {
  schema: "labpack-site.lab.v1",
  id: "fixture-lab",
  title: "A fixture lab",
  summary: "Add a static route so the LAN host reaches the Remote network.",
  prerequisites: null,
  labType: "build",
  level: "associate",
  certifications: ["JNCIA-Junos"],
  topics: ["Static routes"],
  topicGroups: ["static"],
  estimatedMinutes: 30,
  stages: [{ id: "stage-1", title: "One route", goal: "Add 198.51.100.0/24 via 192.0.2.254 and show route lists it." }],
  devices: [
    { id: "lab-router-main", label: "Lab router", context: "main" },
    { id: "provider", label: "Provider", context: "logical-system" },
  ],
  topology: {
    nodes: [
      { id: "lab-router-main", label: "Lab router", shape: "router", tier: 0, order: 0, locals: [{ interface: "lo0", address: "203.0.113.1/32" }] },
      { id: "provider", label: "Provider", shape: "router", tier: 1, order: 0, locals: [] },
    ],
    links: [
      {
        a: { node: "lab-router-main", interface: "ge-0/0/1", address: "192.0.2.253/30" },
        b: { node: "provider", interface: "ge-0/0/3", address: "192.0.2.254/30" },
        subnet: "192.0.2.252/30",
      },
    ],
  },
  requirements: { routers: 1, image: { vendor: "Juniper", product: "vJunos-router", version: "26.2R1.7" }, minimumFreeMemoryGb: 6, minimumCores: 4 },
  qualification: { status: "passed", date: "2026-11-18" },
};

function catalog(overrides: Record<string, unknown> = {}) {
  return {
    schema: "labpack-site.catalog.v1",
    kind: "release",
    client: {
      name: "LabPack",
      channel: "beta",
      build: "abc1234",
      fileName: "LabPack.zip",
      bytes: 1000,
      sha256: "a".repeat(64),
      url: null,
      publisher: "Example Publisher",
      platform: "Windows 11",
      requirements: ["Windows 11"],
    },
    levels: [
      { id: "jncia-junos", name: "JNCIA-Junos", track: "Junos", status: "in-review", note: "In review." },
      { id: "jncis-sp", name: "JNCIS-SP", track: "SP", status: "planned", note: "Planned." },
    ],
    collections: [{ id: "lib", title: "Library", short: "Library", summary: "Standalone labs.", level: "jncia-junos", unlistedInReview: 0 }],
    topicGroups: [{ id: "static", name: "Static routing" }],
    labs: [{ id: "fixture-lab", collection: "lib", status: "in-review" }],
    ...overrides,
  };
}

function makeDir(cat: unknown, labs: Record<string, unknown> = { "fixture-lab": LAB }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-test-"));
  fs.mkdirSync(path.join(dir, "labs"));
  fs.writeFileSync(path.join(dir, "catalog.yaml"), YAML.stringify(cat));
  for (const [id, meta] of Object.entries(labs)) fs.writeFileSync(path.join(dir, "labs", `${id}.json`), JSON.stringify(meta));
  return dir;
}

function problems(cat: unknown, labs?: Record<string, unknown>, env: { production?: boolean } = { production: false }) {
  try {
    loadCatalog(makeDir(cat, labs), env);
    return [];
  } catch (e) {
    if (e instanceof CatalogError) return e.problems;
    throw e;
  }
}

function expectProblem(found: string[], fragment: string) {
  assert.ok(found.some((p) => p.includes(fragment)), `expected a problem containing "${fragment}", got:\n${found.join("\n")}`);
}

const RELEASED = {
  id: "fixture-lab",
  collection: "lib",
  status: "released",
  learnerReadOn: "2026-11-21",
  download: { url: "https://example.com/fixture-lab.labpack", fileName: "fixture-lab.labpack", bytes: 20000, sha256: "b".repeat(64) },
};

test("a clean catalog passes", () => {
  assert.deepEqual(problems(catalog()), []);
  assert.deepEqual(problems(catalog({ labs: [RELEASED], levels: [{ id: "jncia-junos", name: "JNCIA-Junos", track: "Junos", status: "available", note: "Ready." }] })), []);
});

test("schema: a missing field fails", () => {
  expectProblem(problems(catalog(), { "fixture-lab": { ...LAB, title: undefined } }), "title is required");
  expectProblem(problems(catalog(), { "fixture-lab": { ...LAB, schema: "labpack-site.lab.v0" } }), "schema must be labpack-site.lab.v1");
  expectProblem(problems({ ...catalog(), schema: "other" }), "schema must be labpack-site.catalog.v1");
});

test("honesty: a released lab needs its learner read and a real download", () => {
  expectProblem(problems(catalog({ labs: [{ ...RELEASED, learnerReadOn: null }] })), "learnerReadOn must be the YYYY-MM-DD date of its learner read");
  expectProblem(problems(catalog({ labs: [{ ...RELEASED, download: null }] })), "needs a download");
  expectProblem(problems(catalog({ labs: [{ ...RELEASED, download: { ...RELEASED.download, url: "http://example.com/x.labpack" } }] })), "url must start with https://");
  expectProblem(problems(catalog({ labs: [{ ...RELEASED, download: { ...RELEASED.download, sha256: "xyz" } }] })), "sha256 must be 64");
  expectProblem(problems(catalog({ labs: [{ ...RELEASED, download: { ...RELEASED.download, fileName: "x.zip" } }] })), "fileName must end with .labpack");
});

test("honesty: an in-review lab has no download", () => {
  expectProblem(problems(catalog({ labs: [{ ...RELEASED, status: "in-review" }] })), "must not have a download yet");
});

test("honesty: only qualified labs are listed", () => {
  expectProblem(problems(catalog(), { "fixture-lab": { ...LAB, qualification: { status: "failed", date: "2026-11-18" } } }), "only qualified labs");
  expectProblem(problems(catalog(), { "fixture-lab": { ...LAB, qualification: { status: "passed", date: "2026-13-40" } } }), "real YYYY-MM-DD date");
});

test("honesty: levels claim no more than the catalog holds", () => {
  const available = [{ id: "jncia-junos", name: "JNCIA-Junos", track: "Junos", status: "available", note: "x" }];
  expectProblem(problems(catalog({ levels: available })), "marked available but has no released lab");
  const planned = [{ id: "jncia-junos", name: "JNCIA-Junos", track: "Junos", status: "planned", note: "x" }];
  expectProblem(problems(catalog({ levels: planned })), "marked planned but lists labs");
});

test("a development catalog never builds for production", () => {
  expectProblem(problems(catalog({ kind: "development" }), undefined, { production: true }), "development catalog can never be built for production");
  assert.deepEqual(problems(catalog({ kind: "development" }), undefined, { production: false }), []);
});

test("a lab file nobody lists is refused", () => {
  expectProblem(problems(catalog(), { "fixture-lab": LAB, stray: { ...LAB, id: "stray" } }), "labs/stray.json: is not listed");
});

test("every leak marker fires on a planted sample", () => {
  const planted: Record<string, string> = {
    "home-path": "see /Users/someone/notes",
    "workspace-path": "copied from control-corpus/run",
    "ssh-key": "key at ~/.ssh/id_ed25519",
    token: "token ghp_abcdefghijklmnopqrstuvwxyz0123",
    credential: "password: hunter2",
    "image-digest": "image sha256:0123456789abcdef0123",
    "host-address": "lab host at 192.168.1.20",
    "host-name": "ssh to labhost.ts.net",
    "personal-email": "mail someone@gmail.com",
    "authoring-internal": "receiptId: abc",
    "device-output": "inet.0: 12 destinations, 12 routes",
  };
  for (const marker of LEAK_MARKERS) {
    const sample = planted[marker.id];
    assert.ok(sample, `no planted sample for ${marker.id}`);
    assert.ok(scanText(sample).some((f) => f.marker === marker.id), `${marker.id} did not fire on: ${sample}`);
  }
});

test("lab text with documentation addresses and commands is not a leak", () => {
  assert.deepEqual(scanText(JSON.stringify(LAB, null, 2)), []);
  assert.deepEqual(scanText("Run show route 10.10.1.0/24 and ping 198.51.100.1 from the LAN host. sha256 of the file: " + "c".repeat(64)), []);
});

test("the scan reads every built-from file and skips only the exempt ones", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scan-test-"));
  fs.mkdirSync(path.join(root, "src/lib"), { recursive: true });
  fs.mkdirSync(path.join(root, "public"), { recursive: true });
  fs.writeFileSync(path.join(root, "public/note.txt"), "host 172.20.20.5\n");
  fs.writeFileSync(path.join(root, "src/lib/leak-markers.ts"), "pattern /Users/x\n");
  const hits = scanFiles(root, ["src", "public"]);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].file, "public/note.txt");
  assert.equal(hits[0].finding.marker, "host-address");
});

test("validate() fails a catalog that leaks, even when its schema is fine", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "validate-test-"));
  const dir = path.join(root, "content/catalog");
  fs.mkdirSync(path.join(dir, "labs"), { recursive: true });
  fs.writeFileSync(path.join(dir, "catalog.yaml"), YAML.stringify(catalog()));
  fs.writeFileSync(path.join(dir, "labs/fixture-lab.json"), JSON.stringify({ ...LAB, summary: "Copied from /home/someone/lab." }));
  const { problems: found } = validate(root, dir, { production: false });
  expectProblem(found, "home-folder path");
});

/* --- the extractor ------------------------------------------------------ */

const PACKET = {
  schemaVersion: 0,
  id: "fixture-packet",
  title: "Fixture packet",
  summary: "Before you start, you should already know: static routes and ping. Task: add one route.",
  labType: "build",
  level: "associate",
  certifications: ["JNCIA-Junos"],
  topics: ["Static routes"],
  estimatedMinutes: 30,
  nodes: [{ id: "lab-router", kind: "juniper_vjunosrouter", role: "One router" }],
  requirements: { images: [{ kind: "juniper_vjunosrouter", version: "26.2R1.7", obtainFrom: "lab host words" }], minimumFreeMemoryGb: 6, minimumCores: 4 },
  stages: [{ id: "stage-1", title: "One route", goal: "Add the route.", doneWhen: ["show route lists it"] }],
  qualification: [
    {
      contractVersion: "labsmith.learner-labpack-qualification.v0",
      labId: "fixture-packet",
      status: "passed",
      date: "2026-11-18",
      toolVersions: { "imageDigest:lab-router": "sha256:0123456789abcdef0123456789abcdef" },
      cleanup: { topologyName: "internal-run-name" },
    },
  ],
  terminalTargets: {
    contractVersion: "labpack.terminal-targets.v1",
    targets: [
      { id: "lab-router-main", label: "Lab router", node: "lab-router", context: { kind: "main" } },
      { id: "provider", label: "Provider (logical system, do not change)", node: "lab-router", context: { kind: "logical-system", name: "provider" } },
    ],
  },
  displayTopology: {
    contractVersion: "labpack.display-topology.v1",
    nodes: [
      { id: "lab-router-main", role: "Lab router", locals: [], tier: 1 },
      { id: "provider", role: "Provider (logical system inside the Lab router)", locals: [], tier: 2 },
    ],
    links: [{ a: { node: "lab-router-main", interface: "ge-0/0/1", address: "192.0.2.253/30" }, b: { node: "provider", interface: "ge-0/0/3", address: "192.0.2.254/30" }, subnet: "192.0.2.252/30" }],
  },
};

function packetDir(lab: unknown) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "packet-test-"));
  fs.writeFileSync(path.join(dir, "lab.yaml"), YAML.stringify(lab));
  return dir;
}

test("the extractor copies only the allow-list", () => {
  const meta = extract(packetDir(PACKET));
  const text = JSON.stringify(meta);
  for (const absent of ["sha256:", "internal-run-name", "doneWhen", "obtainFrom", "lab host words", "do not change"]) {
    assert.ok(!text.includes(absent), `extracted metadata carries ${absent}`);
  }
  assert.equal(meta.devices[1].label, "Provider");
  assert.equal(meta.prerequisites, "Static routes and ping.");
  assert.equal(meta.summary, "Add one route.");
  assert.deepEqual(meta.qualification, { status: "passed", date: "2026-11-18" });
});

test("the extractor refuses unknown contracts and unqualified packets", () => {
  assert.throws(() => extract(packetDir({ ...PACKET, schemaVersion: 1 })), /schemaVersion 1/);
  assert.throws(() => extract(packetDir({ ...PACKET, displayTopology: { ...PACKET.displayTopology, contractVersion: "labpack.display-topology.v2" } })), /displayTopology contract/);
  assert.throws(() => extract(packetDir({ ...PACKET, qualification: [{ ...PACKET.qualification[0], status: "parked" }] })), /is not qualified/);
  assert.throws(() => extract(packetDir({ ...PACKET, summary: "Copied from /Users/someone/x." })), /would leak/);
});

test("splitSummary moves a prerequisite sentence wherever it sits", () => {
  assert.deepEqual(splitSummary("Do the thing. You should already know: routes and ping."), { summary: "Do the thing.", prerequisites: "Routes and ping." });
  assert.deepEqual(splitSummary("Plain summary."), { summary: "Plain summary.", prerequisites: null });
});
