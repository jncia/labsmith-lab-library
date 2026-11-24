import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { SiteMark } from "@/components/site-mark";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        {/* A smaller mark and wordmark below 360 px keep the header on one line at 320 px. */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 text-base font-bold tracking-[-0.035em] whitespace-nowrap text-ink no-underline min-[360px]:gap-2 min-[360px]:text-lg"
        >
          <SiteMark className="size-6 min-[360px]:size-7" />
          Full Mesh Labs
        </Link>
        <span className="hidden rounded-full border border-line px-2 py-px text-xs font-semibold text-quiet sm:inline">
          beta
        </span>
        <NavLinks />
      </div>
    </header>
  );
}
