/*
 * The catalog: what the site lists, read from files at build time.
 *
 * A catalog directory holds `catalog.yaml` (the release manifest: the client,
 * levels, collections and the labs to list) and `labs/<id>.json` (each listed
 * lab's public-safe metadata, written by scripts/extract-lab-metadata.mts from
 * a qualified packet). Every rule a catalog must keep lives here. The site and
 * the validator both call loadCatalog(), so a malformed catalog fails the
 * build: the build is the publish gate.
 *
 * This file is imported by Next and run directly by Node (type stripping), so
 * it imports only Node built-ins and `yaml`.
 */
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export const CATALOG_SCHEMA = "labpack-site.catalog.v1";
export const LAB_SCHEMA = "labpack-site.lab.v1";

export type ReleaseStatus = "in-review" | "released";
export type LevelStatus = "available" | "in-review" | "planned" | "later";

export type Download = {
  url: string;
  fileName: string;
  bytes: number;
  sha256: string;
};

export type ClientRelease = {
  name: string;
  channel: "beta";
  build: string;
  fileName: string;
  bytes: number;
  sha256: string;
  url: string | null;
  publisher: string;
  platform: string;
  requirements: string[];
};

export const STAGES = ["associate", "specialist", "professional", "expert"] as const;
export type Stage = (typeof STAGES)[number];
export const COLLECTION_KINDS = ["course", "library"] as const;
export type CollectionKind = (typeof COLLECTION_KINDS)[number];

export type Level = {
  id: string;
  name: string;
  track: string;
  stage: Stage;
  status: LevelStatus;
  note: string;
};

/** What a learner needs to download a lab: no account, a free account, the course, or a subscription. */
export type AccessTier = {
  id: string;
  name: string;
  short: string;
  note: string;
  /** True only when the site can hand out a download in this tier today. */
  delivered: boolean;
};

export type Collection = {
  id: string;
  title: string;
  short: string;
  summary: string;
  level: string;
  kind: CollectionKind;
  /** Follows from the access rule: the collection's kind and its level's stage. */
  access: AccessTier;
  unlistedInReview: number;
};

export type TopicGroup = { id: string; name: string };

export type TopologyEnd = { node: string; interface: string; address: string };
export type TopologyNode = {
  id: string;
  label: string;
  shape: "router" | "host";
  tier: number;
  order: number;
  locals: { interface: string; address: string }[];
};
export type TopologyLink = { a: TopologyEnd; b: TopologyEnd; subnet: string };

export type LabStage = { id: string; title: string; goal: string };

export type LabMeta = {
  schema: typeof LAB_SCHEMA;
  id: string;
  title: string;
  summary: string;
  prerequisites: string | null;
  labType: string;
  level: string;
  certifications: string[];
  topics: string[];
  topicGroups: string[];
  estimatedMinutes: number;
  stages: LabStage[];
  devices: { id: string; label: string; context: "main" | "logical-system" }[];
  topology: { nodes: TopologyNode[]; links: TopologyLink[] };
  requirements: {
    routers: number;
    image: { vendor: string; product: string; version: string };
    minimumFreeMemoryGb: number;
    minimumCores: number;
  };
  qualification: { status: "passed"; date: string };
};

export type CatalogLab = LabMeta & {
  collection: Collection;
  release: { status: ReleaseStatus; learnerReadOn: string | null; download: Download | null };
};

export type Catalog = {
  kind: "release" | "development";
  dir: string;
  client: ClientRelease;
  levels: Level[];
  collections: Collection[];
  access: AccessTier[];
  accessRule: Record<CollectionKind, Record<Stage, string>>;
  topicGroups: TopicGroup[];
  labs: CatalogLab[];
};

export class CatalogError extends Error {
  problems: string[];
  constructor(problems: string[]) {
    super(`The catalog has ${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
    this.problems = problems;
  }
}

/* --- small checkers that record a problem instead of throwing ----------- */

type Obj = Record<string, unknown>;

class Checker {
  problems: string[] = [];
  add(where: string, what: string) {
    this.problems.push(`${where}: ${what}`);
  }
  obj(v: unknown, where: string): Obj {
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Obj;
    this.add(where, "must be a mapping");
    return {};
  }
  str(o: Obj, key: string, where: string, opts: { optional?: boolean; max?: number } = {}): string {
    const v = o[key];
    if (v === undefined || v === null) {
      if (!opts.optional) this.add(where, `${key} is required`);
      return "";
    }
    if (typeof v !== "string" || v.trim() === "") {
      this.add(where, `${key} must be a non-empty string`);
      return "";
    }
    if (opts.max && v.length > opts.max) this.add(where, `${key} is longer than ${opts.max} characters`);
    return v;
  }
  num(o: Obj, key: string, where: string, opts: { min?: number; int?: boolean } = {}): number {
    const v = o[key];
    if (typeof v !== "number" || Number.isNaN(v)) {
      this.add(where, `${key} must be a number`);
      return 0;
    }
    if (opts.int && !Number.isInteger(v)) this.add(where, `${key} must be a whole number`);
    if (opts.min !== undefined && v < opts.min) this.add(where, `${key} must be at least ${opts.min}`);
    return v;
  }
  arr(o: Obj, key: string, where: string, opts: { min?: number } = {}): unknown[] {
    const v = o[key];
    if (!Array.isArray(v)) {
      this.add(where, `${key} must be a list`);
      return [];
    }
    if (opts.min !== undefined && v.length < opts.min) this.add(where, `${key} needs at least ${opts.min} item(s)`);
    return v;
  }
  strs(o: Obj, key: string, where: string, opts: { min?: number } = {}): string[] {
    return this.arr(o, key, where, opts).map((v, i) => {
      if (typeof v !== "string" || v.trim() === "") {
        this.add(where, `${key}[${i}] must be a non-empty string`);
        return "";
      }
      return v;
    });
  }
  oneOf<T extends string>(o: Obj, key: string, allowed: readonly T[], where: string): T {
    const v = o[key];
    if (typeof v !== "string" || !allowed.includes(v as T)) {
      this.add(where, `${key} must be one of ${allowed.join(", ")}`);
      return allowed[0];
    }
    return v as T;
  }
}

const ID = /^[a-z0-9][a-z0-9-]{1,80}$/;
const SHA256 = /^[0-9a-f]{64}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

function checkDownload(c: Checker, v: unknown, where: string, extension: string): Download {
  const o = c.obj(v, where);
  const url = c.str(o, "url", where);
  if (url && !url.startsWith("https://")) c.add(where, "url must start with https://");
  const fileName = c.str(o, "fileName", where);
  if (fileName && !fileName.endsWith(extension)) c.add(where, `fileName must end with ${extension}`);
  const bytes = c.num(o, "bytes", where, { min: 1, int: true });
  const sha256 = c.str(o, "sha256", where);
  if (sha256 && !SHA256.test(sha256)) c.add(where, "sha256 must be 64 lower-case hex digits");
  return { url, fileName, bytes, sha256 };
}

/* --- lab metadata ------------------------------------------------------- */

export function checkLabMeta(c: Checker, raw: unknown, where: string): LabMeta {
  const o = c.obj(raw, where);
  if (o.schema !== LAB_SCHEMA) c.add(where, `schema must be ${LAB_SCHEMA} (found ${String(o.schema)})`);
  const id = c.str(o, "id", where);
  if (id && !ID.test(id)) c.add(where, "id must be lower-case letters, digits and hyphens");
  const stages = c.arr(o, "stages", where, { min: 1 }).map((s, i) => {
    const so = c.obj(s, `${where} stages[${i}]`);
    return {
      id: c.str(so, "id", `${where} stages[${i}]`),
      title: c.str(so, "title", `${where} stages[${i}]`, { max: 120 }),
      goal: c.str(so, "goal", `${where} stages[${i}]`, { max: 600 }),
    };
  });
  const devices = c.arr(o, "devices", where, { min: 1 }).map((d, i) => {
    const w = `${where} devices[${i}]`;
    const dobj = c.obj(d, w);
    return {
      id: c.str(dobj, "id", w),
      label: c.str(dobj, "label", w),
      context: c.oneOf(dobj, "context", ["main", "logical-system"] as const, w),
    };
  });
  const topo = c.obj(o.topology, `${where} topology`);
  const nodes = c.arr(topo, "nodes", `${where} topology`, { min: 1 }).map((n, i) => {
    const w = `${where} topology.nodes[${i}]`;
    const no = c.obj(n, w);
    return {
      id: c.str(no, "id", w),
      label: c.str(no, "label", w),
      shape: c.oneOf(no, "shape", ["router", "host"] as const, w),
      tier: c.num(no, "tier", w, { int: true }),
      order: c.num(no, "order", w, { int: true }),
      locals: c.arr(no, "locals", w).map((l, j) => {
        const lo = c.obj(l, `${w} locals[${j}]`);
        return { interface: c.str(lo, "interface", `${w} locals[${j}]`), address: c.str(lo, "address", `${w} locals[${j}]`) };
      }),
    };
  });
  const nodeIds = new Set(nodes.map((n) => n.id));
  const end = (v: unknown, w: string): TopologyEnd => {
    const eo = c.obj(v, w);
    // Some drawings leave an end's address out (an unnumbered or not-yet-addressed port).
    const e = { node: c.str(eo, "node", w), interface: c.str(eo, "interface", w), address: typeof eo.address === "string" ? eo.address : "" };
    if (e.node && !nodeIds.has(e.node)) c.add(w, `node ${e.node} is not in topology.nodes`);
    return e;
  };
  const links = c.arr(topo, "links", `${where} topology`).map((l, i) => {
    const w = `${where} topology.links[${i}]`;
    const lo = c.obj(l, w);
    return { a: end(lo.a, `${w}.a`), b: end(lo.b, `${w}.b`), subnet: typeof lo.subnet === "string" ? lo.subnet : "" };
  });
  const req = c.obj(o.requirements, `${where} requirements`);
  const image = c.obj(req.image, `${where} requirements.image`);
  const qual = c.obj(o.qualification, `${where} qualification`);
  if (qual.status !== "passed") c.add(`${where} qualification`, "status must be passed: only qualified labs can be listed");
  if (!isIsoDate(qual.date)) c.add(`${where} qualification`, "date must be a real YYYY-MM-DD date");
  return {
    schema: LAB_SCHEMA,
    id,
    title: c.str(o, "title", where, { max: 90 }),
    summary: c.str(o, "summary", where, { max: 600 }),
    prerequisites: o.prerequisites === null || o.prerequisites === undefined ? null : c.str(o, "prerequisites", where, { max: 400 }),
    labType: c.str(o, "labType", where),
    level: c.str(o, "level", where),
    certifications: c.strs(o, "certifications", where, { min: 1 }),
    topics: c.strs(o, "topics", where, { min: 1 }),
    topicGroups: c.strs(o, "topicGroups", where, { min: 1 }),
    estimatedMinutes: c.num(o, "estimatedMinutes", where, { min: 5, int: true }),
    stages,
    devices,
    topology: { nodes, links },
    requirements: {
      routers: c.num(req, "routers", `${where} requirements`, { min: 1, int: true }),
      image: {
        vendor: c.str(image, "vendor", `${where} requirements.image`),
        product: c.str(image, "product", `${where} requirements.image`),
        version: c.str(image, "version", `${where} requirements.image`),
      },
      minimumFreeMemoryGb: c.num(req, "minimumFreeMemoryGb", `${where} requirements`, { min: 1 }),
      minimumCores: c.num(req, "minimumCores", `${where} requirements`, { min: 1, int: true }),
    },
    qualification: { status: "passed", date: typeof qual.date === "string" ? qual.date : "" },
  };
}

/* --- the whole catalog -------------------------------------------------- */

export function resolveCatalogDir(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.CATALOG_DIR || "content/catalog");
}

export function loadCatalog(dir: string = resolveCatalogDir(), env: { production?: boolean } = {}): Catalog {
  const c = new Checker();
  const manifestPath = path.join(dir, "catalog.yaml");
  if (!fs.existsSync(manifestPath)) throw new CatalogError([`${manifestPath}: not found`]);
  let raw: unknown;
  try {
    raw = YAML.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    throw new CatalogError([`catalog.yaml: not valid YAML (${(e as Error).message})`]);
  }
  const m = c.obj(raw, "catalog.yaml");
  if (m.schema !== CATALOG_SCHEMA) c.add("catalog.yaml", `schema must be ${CATALOG_SCHEMA} (found ${String(m.schema)})`);
  const kind = c.oneOf(m, "kind", ["release", "development"] as const, "catalog.yaml");
  const production = env.production ?? process.env.SITE_ENV === "production";
  if (production && kind === "development") {
    c.add("catalog.yaml", "a development catalog can never be built for production");
  }

  const co = c.obj(m.client, "client");
  const clientUrl = co.url;
  if (clientUrl !== null && clientUrl !== undefined && (typeof clientUrl !== "string" || !clientUrl.startsWith("https://"))) {
    c.add("client", "url must be null (not hosted yet) or an https:// address");
  }
  const clientSha = c.str(co, "sha256", "client");
  if (clientSha && !SHA256.test(clientSha)) c.add("client", "sha256 must be 64 lower-case hex digits");
  const client: ClientRelease = {
    name: c.str(co, "name", "client"),
    channel: c.oneOf(co, "channel", ["beta"] as const, "client"),
    build: c.str(co, "build", "client"),
    fileName: c.str(co, "fileName", "client"),
    bytes: c.num(co, "bytes", "client", { min: 1, int: true }),
    sha256: clientSha,
    url: typeof clientUrl === "string" ? clientUrl : null,
    publisher: c.str(co, "publisher", "client"),
    platform: c.str(co, "platform", "client"),
    requirements: c.strs(co, "requirements", "client", { min: 1 }),
  };

  const levels: Level[] = c.arr(m, "levels", "catalog.yaml", { min: 1 }).map((l, i) => {
    const w = `levels[${i}]`;
    const lo = c.obj(l, w);
    return {
      id: c.str(lo, "id", w),
      name: c.str(lo, "name", w),
      track: c.str(lo, "track", w),
      stage: c.oneOf(lo, "stage", STAGES, w),
      status: c.oneOf(lo, "status", ["available", "in-review", "planned", "later"] as const, w),
      note: c.str(lo, "note", w),
    };
  });
  const levelIds = new Set(levels.map((l) => l.id));
  const levelById = new Map(levels.map((l) => [l.id, l]));

  // Access: the tiers, and the one rule that says which tier each kind of collection at each stage gets.
  const access: AccessTier[] = c.arr(m, "access", "catalog.yaml", { min: 1 }).map((a, i) => {
    const w = `access[${i}]`;
    const ao = c.obj(a, w);
    if (typeof ao.delivered !== "boolean") c.add(w, "delivered must be true or false");
    return {
      id: c.str(ao, "id", w),
      name: c.str(ao, "name", w),
      short: c.str(ao, "short", w),
      note: c.str(ao, "note", w),
      delivered: ao.delivered === true,
    };
  });
  const tierById = new Map(access.map((a) => [a.id, a]));
  const ruleRaw = c.obj(m.accessRule, "accessRule");
  const accessRule = {} as Record<CollectionKind, Record<Stage, string>>;
  for (const kind of COLLECTION_KINDS) {
    const row = c.obj(ruleRaw[kind], `accessRule.${kind}`);
    accessRule[kind] = {} as Record<Stage, string>;
    for (const stage of STAGES) {
      const tier = c.str(row, stage, `accessRule.${kind}`);
      if (tier && !tierById.has(tier)) c.add(`accessRule.${kind}.${stage}`, `${tier} is not in access`);
      accessRule[kind][stage] = tier;
    }
  }

  const topicGroups: TopicGroup[] = c.arr(m, "topicGroups", "catalog.yaml", { min: 1 }).map((t, i) => {
    const to = c.obj(t, `topicGroups[${i}]`);
    return { id: c.str(to, "id", `topicGroups[${i}]`), name: c.str(to, "name", `topicGroups[${i}]`) };
  });
  const topicIds = new Set(topicGroups.map((t) => t.id));

  const collections: Collection[] = c.arr(m, "collections", "catalog.yaml", { min: 1 }).map((k, i) => {
    const w = `collections[${i}]`;
    const ko = c.obj(k, w);
    if (ko.access !== undefined) c.add(w, "access is not set by hand: it follows from accessRule, the kind and the level");
    const level = c.str(ko, "level", w);
    const kind = c.oneOf(ko, "kind", COLLECTION_KINDS, w);
    if (level && !levelIds.has(level)) c.add(w, `level ${level} is not in levels`);
    const stage = levelById.get(level)?.stage;
    const tier = stage ? tierById.get(accessRule[kind]?.[stage]) : undefined;
    return {
      id: c.str(ko, "id", w),
      title: c.str(ko, "title", w),
      short: c.str(ko, "short", w),
      summary: c.str(ko, "summary", w),
      level,
      kind,
      access: tier ?? { id: "", name: "", short: "", note: "", delivered: false },
      unlistedInReview: c.num(ko, "unlistedInReview", w, { min: 0, int: true }),
    };
  });
  const byCollection = new Map(collections.map((k) => [k.id, k]));

  const seen = new Set<string>();
  const labs: CatalogLab[] = [];
  c.arr(m, "labs", "catalog.yaml").forEach((entry, i) => {
    const w = `labs[${i}]`;
    const eo = c.obj(entry, w);
    const id = c.str(eo, "id", w);
    if (!id) return;
    if (seen.has(id)) c.add(w, `${id} is listed twice`);
    seen.add(id);
    const collection = byCollection.get(c.str(eo, "collection", w));
    if (!collection) c.add(w, `collection must name one of ${[...byCollection.keys()].join(", ")}`);
    const status = c.oneOf(eo, "status", ["in-review", "released"] as const, w);
    const learnerReadOn = eo.learnerReadOn === undefined || eo.learnerReadOn === null ? null : eo.learnerReadOn;
    let download: Download | null = null;
    if (status === "released") {
      // Honesty: a lab is downloadable only after its learner read and with a real file behind it.
      if (!isIsoDate(learnerReadOn)) c.add(w, `${id} is released, so learnerReadOn must be the YYYY-MM-DD date of its learner read`);
      if (eo.download === undefined || eo.download === null) c.add(w, `${id} is released, so it needs a download`);
      else download = checkDownload(c, eo.download, `${w} download`, ".labpack");
      // A public file would hand out a gated lab: release only what the site can deliver in its tier.
      if (collection && !collection.access.delivered) {
        c.add(w, `${id} needs "${collection.access.name || "an unknown tier"}", which the site cannot deliver yet, so it cannot be released`);
      }
    } else if (eo.download !== undefined && eo.download !== null) {
      c.add(w, `${id} is in review, so it must not have a download yet`);
    }
    if (learnerReadOn !== null && !isIsoDate(learnerReadOn)) c.add(w, "learnerReadOn must be a YYYY-MM-DD date");

    const metaPath = path.join(dir, "labs", `${id}.json`);
    if (!fs.existsSync(metaPath)) {
      c.add(w, `labs/${id}.json is missing (write it with scripts/extract-lab-metadata.mts)`);
      return;
    }
    let metaRaw: unknown;
    try {
      metaRaw = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    } catch (e) {
      c.add(`labs/${id}.json`, `not valid JSON (${(e as Error).message})`);
      return;
    }
    const meta = checkLabMeta(c, metaRaw, `labs/${id}.json`);
    if (meta.id && meta.id !== id) c.add(`labs/${id}.json`, `id is ${meta.id}, not ${id}`);
    for (const g of meta.topicGroups) if (g && !topicIds.has(g)) c.add(`labs/${id}.json`, `topic group ${g} is not in topicGroups`);
    if (collection && meta.level && !levelIds.has(meta.level) && !levelIds.has(collection.level)) {
      c.add(`labs/${id}.json`, `level ${meta.level} is unknown`);
    }
    if (collection) {
      labs.push({ ...meta, collection, release: { status, learnerReadOn: typeof learnerReadOn === "string" ? learnerReadOn : null, download } });
    }
  });

  // A lab file nobody lists would be dead weight in a public repo: refuse it.
  const labsDir = path.join(dir, "labs");
  if (fs.existsSync(labsDir)) {
    for (const f of fs.readdirSync(labsDir)) {
      if (f.endsWith(".json") && !seen.has(f.replace(/\.json$/, ""))) c.add(`labs/${f}`, "is not listed in catalog.yaml");
    }
  }

  // Levels must say no more than the catalog holds.
  for (const level of levels) {
    const ofLevel = labs.filter((l) => l.collection.level === level.id);
    const reviewing = collections.filter((k) => k.level === level.id).reduce((n, k) => n + k.unlistedInReview, 0);
    if (level.status === "available" && !ofLevel.some((l) => l.release.status === "released")) {
      c.add(`levels ${level.id}`, "is marked available but has no released lab");
    }
    if (level.status === "in-review" && ofLevel.length === 0 && reviewing === 0) {
      c.add(`levels ${level.id}`, "is marked in-review but no lab of it is listed or counted");
    }
    if ((level.status === "planned" || level.status === "later") && ofLevel.length > 0) {
      c.add(`levels ${level.id}`, `is marked ${level.status} but lists labs`);
    }
  }

  if (c.problems.length) throw new CatalogError(c.problems);
  labs.sort((a, b) => a.collection.id.localeCompare(b.collection.id) || a.id.localeCompare(b.id, "en", { numeric: true }));
  return { kind, dir, client, levels, collections, access, accessRule, topicGroups, labs };
}

/* --- helpers for pages -------------------------------------------------- */

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} bytes`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
