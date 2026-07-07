import type { Lab } from "@/lib/labs";

export function TopologyDiagram({ lab }: { lab: Lab }) {
  return (
    <svg
      role="img"
      aria-label={`${lab.title} topology diagram`}
      viewBox="0 0 720 360"
      className="h-full min-h-[280px] w-full rounded-lg border bg-background"
    >
      <defs>
        <linearGradient id="link-gradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgb(94 234 212)" stopOpacity="0.65" />
          <stop offset="100%" stopColor="rgb(251 191 36)" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {lab.diagram.links.map((link) => {
        const from = lab.diagram.nodes.find((node) => node.id === link.from);
        const to = lab.diagram.nodes.find((node) => node.id === link.to);
        if (!from || !to) {
          return null;
        }
        return (
          <g key={`${link.from}-${link.to}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="url(#link-gradient)"
              strokeWidth="3"
            />
            <text
              x={(from.x + to.x) / 2}
              y={(from.y + to.y) / 2 - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {link.label}
            </text>
          </g>
        );
      })}
      {lab.diagram.nodes.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r="36"
            className={node.role.includes("core") ? "fill-sky-950" : "fill-zinc-900"}
            stroke={node.role.includes("edge") ? "rgb(52 211 153)" : "rgb(148 163 184)"}
            strokeWidth="2"
          />
          <text
            x={node.x}
            y={node.y - 4}
            textAnchor="middle"
            className="fill-foreground font-mono text-[14px] font-semibold"
          >
            {node.id}
          </text>
          <text
            x={node.x}
            y={node.y + 13}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {node.role}
          </text>
        </g>
      ))}
    </svg>
  );
}
