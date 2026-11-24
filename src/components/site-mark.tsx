import { MARK_COLOURS, MARK_LINKS, markGeometry } from "@/lib/mark";

// The mark beside the wordmark in the header, drawn at the weight the design
// gives it near 32 px. Its size comes from `className`. The ring around the
// tile takes the light or dark ring colour from --mark-ring (globals.css).
export function SiteMark({ className }: { className: string }) {
  const g = markGeometry("small");
  const c = MARK_COLOURS;
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <rect x="3" y="3" width="58" height="58" rx="14" fill="var(--mark-ring)" />
      <rect x="5" y="5" width="54" height="54" rx="12" fill={c.tile} />
      <path
        d={MARK_LINKS}
        fill="none"
        stroke={c.link}
        strokeWidth={g.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {g.nodes.map(([x, y]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r={g.radius} fill={c.node} />
      ))}
    </svg>
  );
}
