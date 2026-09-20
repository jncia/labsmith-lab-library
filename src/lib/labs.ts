import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

/**
 * Content-driven lab loader.
 *
 * `content/labs/<slug>/` is the single source of truth. Each lab directory holds:
 *   lab.yaml           — metadata, devices, verification, diagram, workbook tasks
 *   topology.clab.yml  — runnable Containerlab topology (image via env var, never bundled)
 *   configs/<dev>.set  — per-device starting configurations
 *   guide.mdx          — optional human-readable companion (## Goal is surfaced)
 *
 * Everything is read at build time (static generation). Validation throws with a
 * precise message so a malformed lab FAILS THE BUILD — that is the publish gate:
 * nothing structurally broken can reach the public site.
 */

export type LabStatus = "Verified" | "Candidate" | "Planned";

export type LabTask = {
  id: string;
  title: string;
  why: string;
  commands: string[];
  expected: string;
  answer?: {
    explanation?: string;
    commands?: string[];
    output?: string;
  };
};

export type LabDiagramNode = { id: string; role: string; x: number; y: number };
export type LabDiagramLink = { from: string; to: string; label: string };

export type Lab = {
  slug: string;
  title: string;
  summary: string;
  goal?: string;
  status: LabStatus;
  difficulty: string;
  vendor: string;
  nodeCount: number;
  topologyFamily: string;
  technologies: string[];
  scenarios: string[];
  repositoryPath: string;
  topology: string;
  configs: { device: string; role: string; content: string }[];
  tasks: LabTask[];
  verification: {
    lastRun: string;
    mode: string;
    assertions: string;
    junosVersion?: string;
    image?: string;
    notes: string[];
  };
  diagram: {
    nodes: LabDiagramNode[];
    links: LabDiagramLink[];
  };
};

const REPO_WEB_ROOT =
  "https://github.com/jncia/labsmith-lab-library/tree/main/content/labs";

function contentRoot() {
  return path.join(process.cwd(), "content", "labs");
}

function fail(slug: string, message: string): never {
  throw new Error(`[lab-library] ${slug}: ${message}`);
}

function requireString(slug: string, value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    fail(slug, `missing required string field "${field}"`);
  }
  return value;
}

function requireStringArray(slug: string, value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    fail(slug, `field "${field}" must be a list of strings`);
  }
  return value as string[];
}

function normalizeStatus(slug: string, value: unknown): LabStatus {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "verified") return "Verified";
  if (raw === "candidate") return "Candidate";
  if (raw === "planned") return "Planned";
  fail(slug, `status must be verified | candidate | planned (got "${value}")`);
}

/**
 * Deterministic left-to-right layout when lab.yaml omits node coordinates:
 * customer/host nodes on the outside, edge nodes inboard, core in the center.
 * Explicit x/y in lab.yaml always wins (used when a curated layout reads better).
 */
function autoLayout(nodes: Array<{ id: string; role: string; x?: number; y?: number }>): LabDiagramNode[] {
  if (nodes.every((node) => typeof node.x === "number" && typeof node.y === "number")) {
    return nodes as LabDiagramNode[];
  }
  const classify = (role: string) => {
    const value = role.toLowerCase();
    if (/host|customer|\bce\b|ce\d|client/.test(value)) return 0; // outermost
    if (/\bpe\b|pe\d|leaf|edge|asbr/.test(value)) return 1; // inboard
    return 2; // core / spine / rr
  };
  const groups: Record<number, typeof nodes> = { 0: [], 1: [], 2: [] };
  for (const node of nodes) groups[classify(node.role)].push(node);

  const width = 720;
  const height = 360;
  const placed: LabDiagramNode[] = [];
  const columnsFor = (tier: number, index: number, count: number) => {
    // Split each tier between left and right halves; center tier stays centered.
    if (tier === 2) {
      return { x: width / 2, y: 90 + (index + 1) * (height - 140) / (count + 1) };
    }
    const half = index < Math.ceil(count / 2) ? 0 : 1;
    const perHalf = half === 0 ? Math.ceil(count / 2) : Math.floor(count / 2);
    const slot = half === 0 ? index : index - Math.ceil(count / 2);
    const inset = tier === 0 ? 92 : 236;
    const x = half === 0 ? inset : width - inset;
    const y = 70 + (slot + 1) * (height - 110) / (perHalf + 1);
    return { x, y };
  };
  for (const tier of [0, 1, 2] as const) {
    groups[tier].forEach((node, index) => {
      const { x, y } = columnsFor(tier, index, groups[tier].length);
      placed.push({ id: node.id, role: node.role, x: node.x ?? Math.round(x), y: node.y ?? Math.round(y) });
    });
  }
  return placed;
}

function loadLab(slug: string): Lab {
  const dir = path.join(contentRoot(), slug);
  const yamlPath = path.join(dir, "lab.yaml");
  if (!existsSync(yamlPath)) fail(slug, "lab.yaml is missing");
  const data = parse(readFileSync(yamlPath, "utf8"));

  const topologyPath = path.join(dir, "topology.clab.yml");
  if (!existsSync(topologyPath)) fail(slug, "topology.clab.yml is missing");
  const topology = readFileSync(topologyPath, "utf8").trimEnd();

  const devices = Array.isArray(data.devices) ? data.devices : [];
  if (devices.length === 0) fail(slug, "devices list is empty — declare each configured device with a role");
  const configs = devices.map((device: { id?: string; role?: string }) => {
    const id = requireString(slug, device?.id, "devices[].id");
    const role = requireString(slug, device?.role, `devices[${id}].role`);
    const configPath = path.join(dir, "configs", `${id}.set`);
    if (!existsSync(configPath)) fail(slug, `configs/${id}.set is missing for declared device "${id}"`);
    return { device: id, role, content: readFileSync(configPath, "utf8").trimEnd() };
  });

  const rawTasks = Array.isArray(data.tasks) ? data.tasks : [];
  if (rawTasks.length === 0) fail(slug, "tasks list is empty — a workbook needs at least one task");
  const tasks: LabTask[] = rawTasks.map((task: Record<string, unknown>, index: number) => ({
    id: requireString(slug, task?.id ?? `${slug}-task-${index + 1}`, "tasks[].id"),
    title: requireString(slug, task?.title, `tasks[${index}].title`),
    why: requireString(slug, task?.why, `tasks[${index}].why`),
    commands: requireStringArray(slug, task?.commands ?? [], `tasks[${index}].commands`),
    expected: requireString(slug, task?.expected, `tasks[${index}].expected`),
    answer:
      task?.answer && typeof task.answer === "object"
        ? {
            explanation: (task.answer as Record<string, unknown>).explanation as string | undefined,
            commands: (task.answer as Record<string, unknown>).commands as string[] | undefined,
            output: (task.answer as Record<string, unknown>).output as string | undefined,
          }
        : undefined,
  }));

  const verification = data.verification ?? {};
  const diagram = data.diagram ?? {};
  const rawNodes = Array.isArray(diagram.nodes) ? diagram.nodes : [];
  if (rawNodes.length === 0) fail(slug, "diagram.nodes is empty");

  let goal: string | undefined;
  const guidePath = path.join(dir, "guide.mdx");
  if (existsSync(guidePath)) {
    const guide = readFileSync(guidePath, "utf8");
    const match = /##\s*Goal\s*\n+([\s\S]*?)(\n##\s|$)/.exec(guide);
    goal = match?.[1]?.trim();
  }

  return {
    slug,
    title: requireString(slug, data.title, "title"),
    summary: requireString(slug, data.summary, "summary"),
    goal,
    status: normalizeStatus(slug, data.status),
    difficulty: requireString(slug, data.difficulty, "difficulty"),
    vendor: requireString(slug, data.vendor, "vendor"),
    nodeCount: Number(data.node_count) || rawNodes.length,
    topologyFamily: requireString(slug, data.topology_family, "topology_family"),
    technologies: requireStringArray(slug, data.technologies, "technologies"),
    scenarios: requireStringArray(slug, data.scenarios ?? [], "scenarios"),
    repositoryPath: `${REPO_WEB_ROOT}/${slug}`,
    topology,
    configs,
    tasks,
    verification: {
      lastRun: String(verification.last_run ?? "unverified"),
      mode: String(verification.mode ?? "unverified"),
      assertions: String(verification.assertions ?? "none recorded"),
      junosVersion: verification.junos_version ? String(verification.junos_version) : undefined,
      image: verification.image ? String(verification.image) : undefined,
      notes: Array.isArray(verification.notes) ? verification.notes.map(String) : [],
    },
    diagram: {
      nodes: autoLayout(rawNodes),
      links: Array.isArray(diagram.links) ? diagram.links : [],
    },
  };
}

function loadAllLabs(): Lab[] {
  const root = contentRoot();
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((entry) => statSync(path.join(root, entry)).isDirectory())
    .sort()
    .map(loadLab)
    .sort((a, b) => {
      const rank = { Verified: 0, Candidate: 1, Planned: 2 } as const;
      return rank[a.status] - rank[b.status] || a.title.localeCompare(b.title);
    });
}

export const labs: Lab[] = loadAllLabs();

export function getLab(slug: string) {
  return labs.find((lab) => lab.slug === slug);
}
