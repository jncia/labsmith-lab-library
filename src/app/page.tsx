import Link from "next/link";
import { LabCatalog, type CatalogCard } from "@/components/lab-catalog";
import { getCatalog } from "@/lib/site";

export default function Home() {
  const catalog = getCatalog();
  const levelName = new Map(catalog.levels.map((l) => [l.id, l.name]));
  const cards: CatalogCard[] = catalog.labs.map((l) => ({
    id: l.id,
    title: l.title,
    summary: l.summary,
    level: l.collection.level,
    levelName: levelName.get(l.collection.level) ?? l.collection.level,
    collection: l.collection.id,
    collectionShort: l.collection.short,
    topicGroups: l.topicGroups,
    stages: l.stages.length,
    minutes: l.estimatedMinutes,
    access: l.collection.access.short,
    status: l.release.status,
    searchText: [l.title, l.summary, ...l.topics, ...l.stages.map((s) => s.title), l.collection.title]
      .join(" ")
      .toLowerCase(),
  }));
  const released = catalog.labs.filter((l) => l.release.status === "released").length;
  const unlisted = catalog.collections.reduce((n, c) => n + c.unlistedInReview, 0);
  const coming = catalog.levels.filter((l) => l.status === "planned" || l.status === "later");
  const tier = new Map(catalog.access.map((a) => [a.id, a]));
  const accessLine = (stage: (typeof catalog.levels)[number]["stage"]) =>
    `Course labs: ${tier.get(catalog.accessRule.course[stage])?.short.toLowerCase()}. Library labs: ${tier
      .get(catalog.accessRule.library[stage])
      ?.short.toLowerCase()}.`;

  return (
    <>
      <section className="border-b border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 sm:py-16">
          <p className="m-0 text-sm font-semibold text-quiet">Free practice labs for JNCIA-Junos</p>
          <h1 className="m-0 max-w-3xl text-[2rem] leading-tight font-bold sm:text-[2.6rem]">
            Practice Junos on a real router, on your own computer.
          </h1>
          <p className="m-0 max-w-2xl text-lg text-quiet">
            Each lab starts a real Juniper vJunos router inside LabPack, gives you a workbook to follow, and checks your
            work stage by stage.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/start"
              className="inline-flex min-h-11 items-center rounded border border-accent bg-accent px-5 font-semibold text-on-accent no-underline"
            >
              Get started
            </Link>
            <Link
              href="#labs"
              className="inline-flex min-h-11 items-center rounded border border-line bg-card px-5 font-semibold text-ink no-underline hover:bg-selected"
            >
              Browse the labs
            </Link>
          </div>
          <ul className="m-0 grid list-none gap-4 p-0 pt-2 sm:grid-cols-3">
            <li className="grid gap-1 border-t border-line pt-3">
              <strong>A real router</strong>
              <span className="text-sm text-quiet">
                Juniper&apos;s own vJunos-router runs every lab. The commands and the output are real Junos.
              </span>
            </li>
            <li className="grid gap-1 border-t border-line pt-3">
              <strong>Checked as you go</strong>
              <span className="text-sm text-quiet">
                Each stage has a Check that looks at the router and ticks what you got right.
              </span>
            </li>
            <li className="grid gap-1 border-t border-line pt-3">
              <strong>Free to start</strong>
              <span className="text-sm text-quiet">
                LabPack and the JNCIA course labs need no account. The practice library is free with an account.
                LabPack runs on Windows 11.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section id="labs" className="mx-auto grid max-w-6xl scroll-mt-4 gap-5 px-4 pt-10 sm:px-6">
        <div className="grid gap-2">
          <h2 className="m-0 text-2xl font-bold">Labs</h2>
          {released === 0 ? (
            <p className="m-0 max-w-3xl rounded-lg border border-line bg-surface px-4 py-3 text-sm">
              <strong>LabPack is in beta.</strong>{" "}
              {catalog.labs.length
                ? "The labs below are in their final review. Each one opens for download when it is released."
                : `${unlisted} JNCIA-Junos labs are in their final review. They appear here as each one is released.`}
            </p>
          ) : null}
        </div>
        {catalog.labs.length ? (
          <LabCatalog
            labs={cards}
            levels={catalog.levels.map((l) => ({
              id: l.id,
              name: l.name,
              disabled: !catalog.labs.some((x) => x.collection.level === l.id),
              note: l.note,
            }))}
            collections={catalog.collections
              .filter((c) => catalog.labs.some((x) => x.collection.id === c.id))
              .map((c) => ({ id: c.id, name: c.short, note: c.summary }))}
            topics={catalog.topicGroups}
          />
        ) : (
          <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
            {catalog.collections.map((c) => (
              <li key={c.id} className="grid gap-1.5 rounded-lg border border-line bg-card p-4">
                <strong>{c.title}</strong>
                <span className="text-sm text-quiet">{c.summary}</span>
                <span className="text-xs text-quiet">
                  {c.unlistedInReview} labs in review · {c.access.name}
                </span>
              </li>
            ))}
          </ul>
        )}
        {catalog.collections.length ? (
          <ul className="m-0 grid list-none gap-3 p-0 text-sm text-quiet md:grid-cols-2">
            {catalog.collections
              .filter((c) => catalog.labs.some((x) => x.collection.id === c.id))
              .map((c) => (
                <li key={c.id}>
                  <strong className="text-ink">{c.short}:</strong> {c.summary} {c.access.note}
                </li>
              ))}
          </ul>
        ) : null}
      </section>

      {coming.length ? (
        <section className="mx-auto grid max-w-6xl gap-4 px-4 pt-12 sm:px-6">
          <h2 className="m-0 text-xl font-bold">Coming later</h2>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
            {coming.map((l) => (
              <li key={l.id} className="grid gap-1 rounded-lg border border-dashed border-line p-4">
                <strong>{l.name}</strong>
                <span className="text-sm text-quiet">{l.note}</span>
                <span className="text-xs text-quiet">{accessLine(l.stage)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
