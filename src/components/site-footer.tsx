import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-8 text-sm text-quiet sm:px-6">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/#labs" className="hover:text-ink">Labs</Link>
          <Link href="/client" className="hover:text-ink">Get the app</Link>
          <Link href="/start" className="hover:text-ink">Getting started</Link>
        </nav>
        <p className="max-w-3xl">
          Full Mesh Labs is an independent study site and app. It is not made, endorsed or supported by Juniper Networks or
          Hewlett Packard Enterprise. Juniper, Junos, vJunos and JNCIA are trademarks of Juniper Networks, Inc.
          The router image comes from Juniper under Juniper&apos;s own licence; Full Mesh Labs never ships it.
        </p>
      </div>
    </footer>
  );
}
