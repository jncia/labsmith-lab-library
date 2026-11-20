import Link from "next/link";
import { NavLinks } from "@/components/nav-links";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-[-0.035em] text-ink no-underline">
          LabPack
        </Link>
        <span className="hidden rounded-full border border-line px-2 py-px text-xs font-semibold text-quiet sm:inline">
          beta
        </span>
        <NavLinks />
      </div>
    </header>
  );
}
