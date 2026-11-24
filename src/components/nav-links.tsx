"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A short label stands in on narrow screens, below the width in `wide`, so the
// header (mark, wordmark and links) stays on one line down to 320 px.
type NavLink = { href: string; match: (p: string) => boolean; label: string; short?: { text: string; wide: string } };

const LINKS: NavLink[] = [
  { href: "/#labs", match: (p) => p === "/" || p.startsWith("/labs"), label: "Labs" },
  { href: "/client", match: (p) => p.startsWith("/client"), label: "Get the app", short: { text: "App", wide: "min-[400px]" } },
  { href: "/start", match: (p) => p.startsWith("/start"), label: "Getting started", short: { text: "Start", wide: "sm" } },
];

// Spelled out in full so Tailwind finds every class it must generate.
const SHORT_CLASS: Record<string, { short: string; label: string }> = {
  "min-[400px]": { short: "min-[400px]:hidden", label: "hidden min-[400px]:inline" },
  sm: { short: "sm:hidden", label: "hidden sm:inline" },
};

export function NavLinks() {
  const pathname = usePathname() || "/";
  return (
    <nav aria-label="Main" className="ml-auto flex items-center gap-1 text-sm sm:gap-2">
      {LINKS.map((link) => {
        const current = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={`rounded px-2 py-1.5 font-semibold whitespace-nowrap no-underline transition-colors hover:bg-selected ${
              current ? "bg-selected text-ink" : "text-quiet"
            }`}
          >
            {link.short ? (
              <>
                <span className={SHORT_CLASS[link.short.wide].short}>{link.short.text}</span>
                <span className={SHORT_CLASS[link.short.wide].label}>{link.label}</span>
              </>
            ) : (
              link.label
            )}
          </Link>
        );
      })}
    </nav>
  );
}
