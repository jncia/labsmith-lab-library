// The Full Mesh mark: four routers, each linked to every other, on a navy
// tile. Drawn as in the Full Mesh Academy design (brand foundations board,
// 2026-11-20), which Benjamin chose for this site on 2026-11-24. The Academy
// and Full Mesh Labs share the mark; only the wordmark's last word changes.
//
// Small sizes are drawn heavier so the links survive at 16 and 32 pixels,
// exactly as the design board does. One source for the header (SiteMark) and
// for the icon files (scripts/make-icons.mts), so they cannot drift apart.

export const MARK_COLOURS = {
  ringOnLight: "#27344a",
  ringOnDark: "#31405a",
  tile: "#0f1726",
  link: "#7cc4ff",
  node: "#f4f6f7",
} as const;

export type MarkWeight = "regular" | "small" | "tiny";

const NODES: ReadonlyArray<readonly [number, number]> = [
  [19, 21],
  [45, 17],
  [47, 44],
  [20, 46],
];

// The four sides, then the two diagonals.
export const MARK_LINKS = "M19 21L45 17L47 44L20 46ZM19 21L47 44M45 17L20 46";

const WEIGHTS: Record<MarkWeight, { stroke: number; radius: number; ring: boolean }> = {
  regular: { stroke: 3.4, radius: 5.4, ring: true }, // 44 px and up
  small: { stroke: 4, radius: 6, ring: true }, // about 32 px
  tiny: { stroke: 5, radius: 7, ring: false }, // 16 px
};

export function markGeometry(weight: MarkWeight) {
  const w = WEIGHTS[weight];
  return { ...w, nodes: NODES };
}

type SvgOptions = {
  weight: MarkWeight;
  size: number;
  ring?: string;
  // Fill the whole square with the tile colour (for icons the platform rounds
  // itself, such as Apple's home-screen icon).
  fullBleed?: boolean;
};

// A standalone SVG document of the mark, for rendering icon files.
export function markSvg({ weight, size, ring = MARK_COLOURS.ringOnLight, fullBleed = false }: SvgOptions): string {
  const g = markGeometry(weight);
  const c = MARK_COLOURS;
  const tile = fullBleed
    ? `<rect width="64" height="64" fill="${c.tile}"/>`
    : g.ring
      ? `<rect x="3" y="3" width="58" height="58" rx="14" fill="${ring}"/><rect x="5" y="5" width="54" height="54" rx="12" fill="${c.tile}"/>`
      : `<rect x="3" y="3" width="58" height="58" rx="14" fill="${c.tile}"/>`;
  // A full-bleed icon keeps the mesh where it is: the platform rounds the
  // corners, and the mesh already sits well inside them.
  const circles = g.nodes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${g.radius}" fill="${c.node}"/>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">` +
    tile +
    `<path d="${MARK_LINKS}" fill="none" stroke="${c.link}" stroke-width="${g.stroke}" stroke-linecap="round" stroke-linejoin="round"/>` +
    circles +
    `</svg>`
  );
}
