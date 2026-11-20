"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/#labs", match: (p: string) => p === "/" || p.startsWith("/labs"), label: "Labs" },
  { href: "/client", match: (p: string) => p.startsWith("/client"), label: "Get LabPack" },
  { href: "/start", match: (p: string) => p.startsWith("/start"), label: "Getting started", short: "Start" },
];

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
            className={`rounded px-2 py-1.5 font-semibold no-underline transition-colors hover:bg-selected ${
              current ? "bg-selected text-ink" : "text-quiet"
            }`}
          >
            {link.short ? (
              <>
                <span className="sm:hidden">{link.short}</span>
                <span className="hidden sm:inline">{link.label}</span>
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
