import type { LabMeta, TopologyLink, TopologyNode } from "@/lib/catalog";

/*
 * The lab's network, drawn from the packet's own display topology: tiers run
 * left to right, as in the packet's drawing, and nodes in a tier top to
 * bottom by their order. Every device is drawn as the router (or host) it is
 * to the learner. The device the learner configures has the strong outline.
 *
 * Links leave a box through ports spread along the side that faces the other
 * end, with a short straight stub, so two links never share a point. Each end
 * is labelled on one line ("ge-0/0/4 .249"); the subnet sits on the link.
 *
 * On a narrow screen the drawing keeps a readable size and scrolls inside its
 * own frame, and the table under it says the same thing in text.
 */

const MONO = 6.7; // px per character, 11px monospace
const PILL = 6.4; // px per character, 10.5px monospace
const BOLD = 8.4; // px per character, 14px bold
const GAP_X = 240;
const GAP_Y = 70;
const PAD = 24;
const STUB = 16;
const PORT_PITCH = 42;

type Side = "left" | "right" | "top" | "bottom";
type Local = { iface: string; address: string; note: string };
type Placed = TopologyNode & { x: number; y: number; w: number; h: number; col: number; shown: Local[] };
type Port = { x: number; y: number; side: Side };

/** Split "lo0 (Remote network cloud)" / "198.51.100.1/24 (Remote network)" into the text and a short note. */
function splitNote(text: string) {
  const notes: string[] = [];
  const bare = text.replace(/\s*\(([^)]*)\)/g, (_, n: string) => {
    notes.push(n.replace(/\bcloud\b/gi, "").trim());
    return "";
  });
  return { bare: bare.trim(), notes: notes.filter(Boolean) };
}

function locals(n: TopologyNode): Local[] {
  return n.locals.map((l) => {
    const i = splitNote(l.interface);
    const a = splitNote(l.address);
    return { iface: i.bare, address: a.bare, note: [...new Set([...i.notes, ...a.notes])].join(", ") };
  });
}

/** ".249" when the address sits in the link's IPv4 subnet of /24 or longer, else the address without its length. */
function shortAddress(address: string, subnet: string) {
  const ip = address.replace(/\/\d+$/, "");
  const m = /^(\d+\.\d+\.\d+)\.(\d+)$/.exec(ip);
  const s = /^(\d+\.\d+\.\d+)\.\d+\/(\d+)$/.exec(subnet);
  if (m && s && Number(s[2]) >= 24 && m[1] === s[1]) return `.${m[2]}`;
  return ip;
}

function sideFacing(from: Placed, to: Placed): Side {
  if (from.col !== to.col) return to.col > from.col ? "right" : "left";
  return to.y > from.y ? "bottom" : "top";
}

/**
 * The drawing's tiers, or, when it gives every node the same tier, layers by hop
 * distance from its first node (as the packet's own drawing does).
 */
function tiersOf(nodes: TopologyNode[], links: TopologyLink[]): Map<string, number> {
  if (new Set(nodes.map((n) => n.tier)).size > 1) return new Map(nodes.map((n) => [n.id, n.tier]));
  const first = [...nodes].sort((a, b) => a.order - b.order)[0];
  const layer = new Map<string, number>([[first.id, 0]]);
  const queue = [first.id];
  while (queue.length) {
    const id = queue.shift()!;
    for (const l of links) {
      const next = l.a.node === id ? l.b.node : l.b.node === id ? l.a.node : null;
      if (next && !layer.has(next)) {
        layer.set(next, layer.get(id)! + 1);
        queue.push(next);
      }
    }
  }
  const deepest = Math.max(...layer.values());
  for (const n of nodes) if (!layer.has(n.id)) layer.set(n.id, deepest + 1);
  return layer;
}

function endText(l: TopologyLink, end: "a" | "b") {
  const e = l[end];
  return [e.interface, e.address && shortAddress(e.address, l.subnet)].filter(Boolean).join(" ");
}

function layout(nodes: TopologyNode[], links: TopologyLink[]) {
  const tierOf = tiersOf(nodes, links);
  const tiers = [...new Set(tierOf.values())].sort((a, b) => a - b);
  const colOf = new Map(nodes.map((n) => [n.id, tiers.indexOf(tierOf.get(n.id)!)]));
  const columns = tiers.map((t) => nodes.filter((n) => tierOf.get(n.id) === t).sort((a, b) => a.order - b.order));
  // Each gap is wide enough for the end labels and the subnet of every link that crosses it.
  const gaps = tiers.slice(1).map((_, gi) =>
    Math.max(
      GAP_X,
      ...links
        .filter((l) => {
          const ca = colOf.get(l.a.node);
          const cb = colOf.get(l.b.node);
          return ca !== undefined && cb !== undefined && Math.min(ca, cb) === gi && Math.max(ca, cb) === gi + 1;
        })
        .map((l) => (endText(l, "a").length + endText(l, "b").length) * MONO + l.subnet.length * PILL + 14 + 44),
    ),
  );

  // How many ports each node needs on its left and right sides.
  const sideCount = new Map<string, number>();
  for (const l of links) {
    for (const [me, other] of [[l.a.node, l.b.node], [l.b.node, l.a.node]] as const) {
      const cm = colOf.get(me);
      const co = colOf.get(other);
      if (cm === undefined || co === undefined || cm === co) continue;
      const key = `${me}:${co > cm ? "right" : "left"}`;
      sideCount.set(key, (sideCount.get(key) ?? 0) + 1);
    }
  }
  const sized = nodes.map((n) => {
    const shown = locals(n);
    const textW = Math.max(
      n.label.length * BOLD + 48,
      ...shown.map((l) => (l.iface.length + l.address.length + 1) * MONO + 26),
      ...shown.map((l) => l.note.length * 6.2 + 26),
    );
    const ports = Math.max(sideCount.get(`${n.id}:left`) ?? 0, sideCount.get(`${n.id}:right`) ?? 0);
    const h = Math.max(46 + shown.reduce((s, l) => s + (l.note ? 30 : 16), 0), (ports + 1) * PORT_PITCH);
    return { n, shown, w: Math.max(150, Math.ceil(textW)), h };
  });
  const byId = new Map(sized.map((s) => [s.n.id, s]));
  const colW = columns.map((col) => Math.max(...col.map((n) => byId.get(n.id)!.w)));
  const colH = columns.map((col) => col.reduce((s, n) => s + byId.get(n.id)!.h, 0) + GAP_Y * (col.length - 1));
  const innerH = Math.max(...colH);
  const placed = new Map<string, Placed>();
  let x = PAD;
  columns.forEach((col, ci) => {
    let y = PAD + (innerH - colH[ci]) / 2;
    for (const n of col) {
      const s = byId.get(n.id)!;
      placed.set(n.id, { ...n, x: x + (colW[ci] - s.w) / 2, y, w: s.w, h: s.h, col: ci, shown: s.shown });
      y += s.h + GAP_Y;
    }
    x += colW[ci] + (gaps[ci] ?? 0);
  });
  const width = x + PAD;
  const height = innerH + PAD * 2;

  // Spread each side's ports, ordered by where the other end sits, so links do not cross at the box.
  const ends = new Map<string, { link: number; end: "a" | "b"; other: Placed }[]>();
  links.forEach((l, i) => {
    for (const [end, me, other] of [["a", l.a.node, l.b.node], ["b", l.b.node, l.a.node]] as const) {
      const p = placed.get(me);
      const o = placed.get(other);
      if (!p || !o) continue;
      const key = `${me}:${sideFacing(p, o)}`;
      ends.set(key, [...(ends.get(key) ?? []), { link: i, end, other: o }]);
    }
  });
  const ports = new Map<string, Port>();
  for (const [key, list] of ends) {
    const [id, side] = key.split(":") as [string, Side];
    const p = placed.get(id)!;
    const horizontal = side === "left" || side === "right";
    list.sort((u, v) => (horizontal ? u.other.y + u.other.h / 2 - (v.other.y + v.other.h / 2) : u.other.x - v.other.x));
    list.forEach((e, k) => {
      const f = (k + 1) / (list.length + 1);
      const port: Port = horizontal
        ? { x: side === "right" ? p.x + p.w : p.x, y: p.y + p.h * f, side }
        : { x: p.x + p.w * f, y: side === "bottom" ? p.y + p.h : p.y, side };
      ports.set(`${e.link}:${e.end}`, port);
    });
  }
  return { placed, ports, width, height };
}

function stubEnd(p: Port) {
  if (p.side === "right") return { x: p.x + STUB, y: p.y };
  if (p.side === "left") return { x: p.x - STUB, y: p.y };
  if (p.side === "bottom") return { x: p.x, y: p.y + STUB };
  return { x: p.x, y: p.y - STUB };
}

/** One-line end label beside the port, on the side away from where the link heads. */
function EndLabel({ port, toward, text }: { port: Port; toward: { x: number; y: number }; text: string }) {
  if (port.side === "left" || port.side === "right") {
    const below = toward.y < port.y - 2;
    const x = port.x + (port.side === "right" ? 5 : -5);
    return (
      <text x={x} y={below ? port.y + 13 : port.y - 5} textAnchor={port.side === "right" ? "start" : "end"} className="fill-ink font-mono text-[11px]">
        {text}
      </text>
    );
  }
  const y = port.side === "bottom" ? port.y + 14 : port.y - 6;
  return (
    <text x={port.x + 6} y={y} className="fill-ink font-mono text-[11px]">
      {text}
    </text>
  );
}

function DeviceIcon({ x, y, shape }: { x: number; y: number; shape: "router" | "host" }) {
  if (shape === "host") {
    return (
      <g className="fill-none stroke-quiet" strokeWidth={1.4}>
        <rect x={x} y={y + 1} width={16} height={11} rx={1.5} />
        <path d={`M${x + 5} ${y + 15.5}h6M${x + 8} ${y + 12}v3.5`} />
      </g>
    );
  }
  return (
    <g className="fill-none stroke-quiet" strokeWidth={1.4}>
      <circle cx={x + 8} cy={y + 8} r={7.5} />
      <path d={`M${x + 4} ${y + 8}h8M${x + 8} ${y + 4}v8`} />
    </g>
  );
}

export function TopologyDrawing({ lab }: { lab: LabMeta }) {
  const { nodes, links } = lab.topology;
  const { placed, ports, width, height } = layout(nodes, links);
  const main = new Set(lab.devices.filter((d) => d.context === "main").map((d) => d.id));
  const labelOf = (id: string) => placed.get(id)?.label ?? id;

  return (
    <figure className="m-0 grid gap-3">
      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto block h-auto"
          style={{ width: "100%", maxWidth: width, minWidth: Math.min(width, 640) }}
          role="img"
          aria-labelledby={`topo-${lab.id}-title`}
        >
          <title id={`topo-${lab.id}-title`}>{`The network of ${lab.title}: ${nodes.map((n) => n.label).join(", ")}`}</title>
          {links.map((l, i) => {
            const pa = ports.get(`${i}:a`);
            const pb = ports.get(`${i}:b`);
            if (!pa || !pb) return null;
            const sa = stubEnd(pa);
            const sb = stubEnd(pb);
            const mx = (sa.x + sb.x) / 2;
            const my = (sa.y + sb.y) / 2;
            const pillW = l.subnet.length * PILL + 14;
            return (
              <g key={i}>
                <polyline
                  points={`${pa.x},${pa.y} ${sa.x},${sa.y} ${sb.x},${sb.y} ${pb.x},${pb.y}`}
                  className="fill-none stroke-focus"
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
                <EndLabel port={pa} toward={sb} text={endText(l, "a")} />
                <EndLabel port={pb} toward={sa} text={endText(l, "b")} />
                {l.subnet ? (
                  <g>
                    <rect x={mx - pillW / 2} y={my - 9} width={pillW} height={18} rx={9} className="fill-card stroke-line" />
                    <text x={mx} y={my + 3.6} textAnchor="middle" className="fill-quiet font-mono text-[10.5px]">
                      {l.subnet}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
          {[...placed.values()].map((n) => {
            const isMain = main.has(n.id);
            let ly = n.y + 46;
            return (
              <g key={n.id}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={6}
                  className={isMain ? "fill-selected stroke-accent" : "fill-surface stroke-line"}
                  strokeWidth={isMain ? 2.4 : 1.4}
                />
                <DeviceIcon x={n.x + 12} y={n.y + 12} shape={n.shape} />
                <text x={n.x + 36} y={n.y + 25} className="fill-ink text-[14px] font-bold">
                  {n.label}
                </text>
                {n.shown.map((loc, j) => {
                  const y = ly;
                  ly += loc.note ? 30 : 16;
                  return (
                    <g key={j}>
                      <text x={n.x + 12} y={y} className="fill-quiet font-mono text-[11px]">
                        {`${loc.iface} ${loc.address}`}
                      </text>
                      {loc.note ? (
                        <text x={n.x + 12} y={y + 14} className="fill-quiet text-[11px] italic">
                          {loc.note}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="m-0 text-sm text-quiet sm:hidden">Scroll the drawing sideways to see all of it.</p>
      <figcaption className="text-sm text-quiet">
        The strong outline marks the router you configure. Everything else is there for it to talk to.
      </figcaption>
      <details className="rounded-lg border border-line bg-card text-sm">
        <summary className="cursor-pointer px-4 py-2.5 font-semibold">The links in text</summary>
        <div className="overflow-x-auto px-4 pb-3">
          <table className="w-full min-w-[480px] border-collapse text-left">
            <thead className="text-quiet">
              <tr>
                <th className="py-1.5 pr-4 font-semibold">From</th>
                <th className="py-1.5 pr-4 font-semibold">To</th>
                <th className="py-1.5 font-semibold">Subnet</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[13px]">
              {links.map((l, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="py-1.5 pr-4">
                    <span className="font-sans font-semibold">{labelOf(l.a.node)}</span> {l.a.interface} {l.a.address}
                  </td>
                  <td className="py-1.5 pr-4">
                    <span className="font-sans font-semibold">{labelOf(l.b.node)}</span> {l.b.interface} {l.b.address}
                  </td>
                  <td className="py-1.5">{l.subnet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
