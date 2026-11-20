/*
 * Write a lab's public-safe metadata from a qualified LabPack packet.
 *
 *   node scripts/extract-lab-metadata.mts --out <catalog dir> [--register <collection id>] <packet dir>...
 *
 * Reads only <packet dir>/lab.yaml and copies an ALLOW-LIST of fields into
 * <catalog dir>/labs/<id>.json: titles, summary, topics, stage titles and
 * goals, the drawing's nodes and links, terminal labels, image version,
 * memory and core figures, and the qualification status and date. Nothing
 * else crosses: no configs, solutions, checks, workbook, authoring records,
 * digests, run names or device output.
 *
 * With --register, the lab is also added to <catalog dir>/catalog.yaml as
 * `in-review` (an existing entry is left as it is). Releasing a lab is a
 * hand edit of that entry after its learner read.
 *
 * Packet paths are given on the command line and never written anywhere.
 */
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { LAB_SCHEMA, type LabMeta, type TopologyNode } from "../src/lib/catalog.ts";
import { scanText } from "../src/lib/leak-markers.ts";

// The packet contracts this extractor understands. Anything else is refused,
// never guessed at: a new contract version needs a reviewed change here.
const PACKET_SCHEMA_VERSIONS = [0];
const DISPLAY_TOPOLOGY = "labpack.display-topology.v1";
const TERMINAL_TARGETS = "labpack.terminal-targets.v1";
const QUALIFICATION = "labsmith.learner-labpack-qualification.v0";
const IMAGE_KINDS: Record<string, { vendor: string; product: string }> = {
  juniper_vjunosrouter: { vendor: "Juniper", product: "vJunos-router" },
};

// Broad groups for the catalog's topic filter, matched on the packet's own topics and title.
const TOPIC_RULES: [string, RegExp][] = [
  ["config", /configuration mode|candidate|commit|rollback|\bload (?:merge|replace|set)\b|configuration groups|apply-groups|unused configuration|prepared configuration|comparing (?:the candidate|changes)|wildcards in groups|inheritance/i],
  ["addressing", /\bip(?:v4|v6)? address|ipv4 addressing|interface addresses|subnet|ipv6|dual-stack|\barp\b|interface configuration|prefix lengths/i],
  ["static", /static|default route|longest|route preference|qualified-next-hop|discard|forwarding table|return (?:route|path)|route lookup|backup path|multi-hop/i],
  ["ospf", /ospf/i],
  ["policy", /routing policy|route filter|policy terms|export policy|import policy|default route by policy/i],
  ["filters", /firewall|filter terms|transit filter|loopback filter|routing engine|unicast rpf|input filters|source address match/i],
  ["troubleshooting", /troubleshoot|find and fix|\bfault\b|one-way/i],
];

type Obj = Record<string, unknown>;

function fail(packet: string, what: string): never {
  throw new Error(`${path.basename(packet)}: ${what}`);
}

function asObj(v: unknown, packet: string, what: string): Obj {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Obj;
  fail(packet, `${what} must be a mapping`);
}

function asList(v: unknown, packet: string, what: string): unknown[] {
  if (Array.isArray(v)) return v;
  fail(packet, `${what} must be a list`);
}

// A device is named as the learner knows it: "Provider", never "Provider (logical
// system, do not change)". How the lab is built is said once on the page, not
// stuck to every name.
function plainName(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, "").trim() || label;
}

/**
 * Some summaries open or close with what the learner should know first. That is a
 * prerequisite, not a description: it is moved to its own field, and a "Task:"
 * lead-in left behind is dropped.
 */
export function splitSummary(summary: string): { summary: string; prerequisites: string | null } {
  const m = /(?:^|\s)((?:Before you start,?\s+)?you should (?:already )?know:\s*)(.+?\.)(?=\s|$)/i.exec(summary);
  if (!m) return { summary, prerequisites: null };
  const before = summary.slice(0, m.index).trim();
  const after = summary.slice(m.index + m[0].length).trim();
  let rest = [before, after].filter(Boolean).join(" ");
  rest = rest.replace(/^(?:(?:your|the)\s+)?task:\s*/i, "");
  rest = rest.charAt(0).toUpperCase() + rest.slice(1);
  const known = m[2].trim();
  return { summary: rest || summary, prerequisites: known.charAt(0).toUpperCase() + known.slice(1) };
}

function text(v: unknown, packet: string, what: string): string {
  if (typeof v === "string" && v.trim()) return v.replace(/\s+/g, " ").trim();
  fail(packet, `${what} must be text`);
}

export function extract(packet: string): LabMeta {
  const file = path.join(packet, "lab.yaml");
  if (!fs.existsSync(file)) fail(packet, "has no lab.yaml");
  const lab = asObj(YAML.parse(fs.readFileSync(file, "utf8")), packet, "lab.yaml");

  if (!PACKET_SCHEMA_VERSIONS.includes(lab.schemaVersion as number)) {
    fail(packet, `schemaVersion ${String(lab.schemaVersion)} is not one this extractor reads (${PACKET_SCHEMA_VERSIONS.join(", ")})`);
  }
  const quals = asList(lab.qualification, packet, "qualification");
  const qual = asObj(quals[quals.length - 1], packet, "qualification");
  if (qual.contractVersion !== QUALIFICATION) fail(packet, `qualification contract ${String(qual.contractVersion)} is unknown`);
  if (qual.status !== "passed") fail(packet, `is not qualified (status ${String(qual.status)})`);
  if (qual.labId !== lab.id) fail(packet, "qualification is for another lab");

  const targets = asObj(lab.terminalTargets, packet, "terminalTargets");
  if (targets.contractVersion !== TERMINAL_TARGETS) fail(packet, `terminalTargets contract ${String(targets.contractVersion)} is unknown`);
  const devices = asList(targets.targets, packet, "terminalTargets.targets").map((t, i) => {
    const to = asObj(t, packet, `terminal target ${i}`);
    const kind = asObj(to.context, packet, `terminal target ${i} context`).kind;
    if (kind !== "main" && kind !== "logical-system") fail(packet, `terminal target ${i} has context ${String(kind)}`);
    return { id: text(to.id, packet, "target id"), label: plainName(text(to.label, packet, "target label")), context: kind };
  });
  const labelOf = new Map(devices.map((d) => [d.id, d.label]));

  const display = asObj(lab.displayTopology, packet, "displayTopology");
  if (display.contractVersion !== DISPLAY_TOPOLOGY) fail(packet, `displayTopology contract ${String(display.contractVersion)} is unknown`);
  const nodes: TopologyNode[] = asList(display.nodes, packet, "displayTopology.nodes").map((n, i) => {
    const no = asObj(n, packet, `drawing node ${i}`);
    const id = text(no.id, packet, "drawing node id");
    const role = typeof no.role === "string" ? no.role : "";
    // The learner's name for a device is its terminal label; never the role text,
    // which can describe how the lab is built rather than what the device is.
    const label = plainName(labelOf.get(id) ?? fail(packet, `drawing node ${id} has no terminal label`));
    return {
      id,
      label,
      shape: /\bhost\b/i.test(label) || /^host$/i.test(role) ? "host" : "router",
      tier: typeof no.tier === "number" ? no.tier : 0,
      order: typeof no.order === "number" ? no.order : i,
      locals: (Array.isArray(no.locals) ? no.locals : []).map((l, j) => {
        const lo = asObj(l, packet, `drawing node ${id} local ${j}`);
        return { interface: text(lo.interface, packet, "local interface"), address: text(lo.address, packet, "local address") };
      }),
    };
  });
  const links = asList(display.links, packet, "displayTopology.links").map((l, i) => {
    const lo = asObj(l, packet, `drawing link ${i}`);
    const end = (v: unknown, side: string) => {
      const eo = asObj(v, packet, `drawing link ${i} ${side}`);
      return {
        node: text(eo.node, packet, "link node"),
        interface: text(eo.interface, packet, "link interface"),
        address: typeof eo.address === "string" ? eo.address : "",
      };
    };
    return { a: end(lo.a, "a"), b: end(lo.b, "b"), subnet: typeof lo.subnet === "string" ? lo.subnet : "" };
  });

  const labNodes = asList(lab.nodes, packet, "nodes").map((n) => asObj(n, packet, "node"));
  const kinds = new Set(labNodes.map((n) => String(n.kind)));
  if (kinds.size !== 1) fail(packet, `mixes node kinds (${[...kinds].join(", ")}); the site does not describe that yet`);
  const kind = [...kinds][0];
  const image = IMAGE_KINDS[kind] ?? fail(packet, `node kind ${kind} is unknown to the site`);
  const req = asObj(lab.requirements, packet, "requirements");
  const reqImages = asList(req.images, packet, "requirements.images").map((x) => asObj(x, packet, "image"));
  const version = text(reqImages.find((x) => x.kind === kind)?.version, packet, "image version");

  const topics = asList(lab.topics, packet, "topics").map((t) => text(t, packet, "topic"));
  const title = text(lab.title, packet, "title");
  const haystack = [title, ...topics].join(" ; ");
  const topicGroups = TOPIC_RULES.filter(([, re]) => re.test(haystack)).map(([id]) => id);
  if (!topicGroups.length) fail(packet, "matches no topic group; add a rule");

  const qualDate = text(qual.date, packet, "qualification date");
  const meta: LabMeta = {
    schema: LAB_SCHEMA,
    id: text(lab.id, packet, "id"),
    title,
    ...splitSummary(text(lab.summary, packet, "summary")),
    labType: text(lab.labType, packet, "labType"),
    level: text(lab.level, packet, "level"),
    certifications: asList(lab.certifications, packet, "certifications").map((c) => text(c, packet, "certification")),
    topics,
    topicGroups,
    estimatedMinutes: typeof lab.estimatedMinutes === "number" ? lab.estimatedMinutes : fail(packet, "estimatedMinutes must be a number"),
    stages: asList(lab.stages, packet, "stages").map((s, i) => {
      const so = asObj(s, packet, `stage ${i}`);
      return { id: text(so.id, packet, "stage id"), title: text(so.title, packet, "stage title"), goal: text(so.goal, packet, "stage goal") };
    }),
    devices: devices as LabMeta["devices"],
    topology: { nodes, links },
    requirements: {
      routers: labNodes.length,
      image: { ...image, version },
      minimumFreeMemoryGb: typeof req.minimumFreeMemoryGb === "number" ? req.minimumFreeMemoryGb : fail(packet, "minimumFreeMemoryGb must be a number"),
      minimumCores: typeof req.minimumCores === "number" ? req.minimumCores : fail(packet, "minimumCores must be a number"),
    },
    qualification: { status: "passed", date: qualDate },
  };

  const findings = scanText(JSON.stringify(meta, null, 2));
  if (findings.length) {
    fail(packet, `public metadata would leak: ${findings.map((f) => `${f.marker} (${f.excerpt})`).join("; ")}`);
  }
  return meta;
}

function register(catalogFile: string, id: string, collection: string) {
  const doc = YAML.parseDocument(fs.readFileSync(catalogFile, "utf8"));
  const labs = doc.get("labs") as YAML.YAMLSeq | undefined;
  const list = labs ?? new YAML.YAMLSeq();
  const exists = list.items.some((item) => YAML.isMap(item) && item.get("id") === id);
  if (exists) return false;
  list.add(doc.createNode({ id, collection, status: "in-review" }));
  if (!labs) doc.set("labs", list);
  fs.writeFileSync(catalogFile, doc.toString({ lineWidth: 0 }));
  return true;
}

function main(argv: string[]) {
  let out = "";
  let collection = "";
  const packets: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out = argv[++i] ?? "";
    else if (argv[i] === "--register") collection = argv[++i] ?? "";
    else packets.push(argv[i]);
  }
  if (!out || !packets.length) {
    console.error("usage: node scripts/extract-lab-metadata.mts --out <catalog dir> [--register <collection id>] <packet dir>...");
    process.exit(2);
  }
  fs.mkdirSync(path.join(out, "labs"), { recursive: true });
  let failed = 0;
  for (const packet of packets) {
    try {
      const meta = extract(packet);
      fs.writeFileSync(path.join(out, "labs", `${meta.id}.json`), JSON.stringify(meta, null, 2) + "\n");
      const added = collection ? register(path.join(out, "catalog.yaml"), meta.id, collection) : false;
      console.log(`wrote labs/${meta.id}.json${added ? `, listed in ${collection} as in-review` : ""}`);
    } catch (e) {
      failed++;
      console.error(`refused ${(e as Error).message}`);
    }
  }
  if (failed) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
