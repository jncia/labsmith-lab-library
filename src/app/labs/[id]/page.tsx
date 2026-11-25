import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { StatusPill } from "@/components/lab-catalog";
import { TopologyDrawing } from "@/components/topology-drawing";
import { formatBytes, formatDate } from "@/lib/catalog";
import { NO_LABS_PLACEHOLDER } from "@/lib/hosting";
import { downloadPath, getCatalog } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  const ids = getCatalog().labs.map((lab) => ({ id: lab.id }));
  return ids.length > 0 ? ids : [{ id: NO_LABS_PLACEHOLDER }];
}

function findLab(id: string) {
  return getCatalog().labs.find((l) => l.id === id);
}

export async function generateMetadata({ params }: PageProps<"/labs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const lab = findLab(id);
  if (!lab) return { title: "Lab not found" };
  return {
    title: lab.title,
    description: lab.summary,
    openGraph: { title: lab.title, description: lab.summary, type: "article" },
  };
}

function listNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export default async function LabPage({ params }: PageProps<"/labs/[id]">) {
  const { id } = await params;
  const lab = findLab(id);
  if (!lab) notFound();
  const catalog = getCatalog();
  const level = catalog.levels.find((l) => l.id === lab.collection.level);
  const main = lab.devices.find((d) => d.context === "main");
  const others = lab.devices.filter((d) => d.context === "logical-system").map((d) => d.label);
  const released = lab.release.status === "released" && lab.release.download;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lab.title,
    description: lab.summary,
    learningResourceType: "Hands-on lab",
    educationalLevel: level?.name,
    teaches: lab.topics.join(", "),
    timeRequired: `PT${lab.estimatedMinutes}M`,
    isAccessibleForFree: true,
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-quiet">
        <Link href="/#labs" className="hover:text-ink">
          Labs
        </Link>{" "}
        / <span>{lab.collection.short}</span>
      </nav>

      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={lab.release.status} />
          <span className="text-sm text-quiet">
            {level?.name} · {lab.collection.title}
          </span>
        </div>
        <h1 className="m-0 text-[1.8rem] leading-tight font-bold sm:text-[2.2rem]">{lab.title}</h1>
        <p className="m-0 max-w-3xl text-lg text-quiet">{lab.summary}</p>
        <p className="m-0 text-sm text-quiet">
          {lab.stages.length} {lab.stages.length === 1 ? "stage" : "stages"} · about {lab.estimatedMinutes} minutes of
          work · {lab.requirements.routers} virtual router
        </p>
      </header>

      <section aria-labelledby="network" className="grid gap-3">
        <h2 id="network" className="m-0 text-xl font-bold">
          The network
        </h2>
        <TopologyDrawing lab={lab} />
        {others.length ? (
          <p className="m-0 max-w-3xl text-sm text-quiet">
            One virtual router runs this whole lab: the {listNames(others)} run inside it as logical systems, so the
            lab fits on a laptop. The app opens a terminal on each of them
            {main ? ` as well as on the ${main.label}` : ""}.
          </p>
        ) : null}
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-8">
          <section aria-labelledby="stages" className="grid gap-3">
            <h2 id="stages" className="m-0 text-xl font-bold">
              Stages
            </h2>
            <ol className="m-0 grid list-none gap-3 p-0">
              {lab.stages.map((s, i) => (
                <li key={s.id} className="flex gap-3 rounded-lg border border-line bg-card p-4">
                  <span className={`step-n ${i === 0 ? "current" : ""}`} aria-hidden>
                    {i + 1}
                  </span>
                  <div className="grid gap-1">
                    <h3 className="m-0 text-base font-bold">
                      <span className="sr-only">Stage {i + 1}: </span>
                      {s.title}
                    </h3>
                    <p className="m-0 text-[0.95rem] text-quiet">{s.goal}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="m-0 text-sm text-quiet">
              Each stage ends with a Check in the app that looks at the router and ticks each thing you got right.
              The answers stay hidden until you ask for them.
            </p>
          </section>

          <section aria-labelledby="topics" className="grid gap-3">
            <h2 id="topics" className="m-0 text-xl font-bold">
              What it practises
            </h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {lab.topics.map((t) => (
                <li key={t} className="rounded border border-line bg-card px-2.5 py-1 text-sm">
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="checked" className="grid gap-2">
            <h2 id="checked" className="m-0 text-xl font-bold">
              Tried on a real router
            </h2>
            <p className="m-0 max-w-3xl text-[0.95rem] text-quiet">
              On {formatDate(lab.qualification.date)}{" "}this lab was run end to end on a real vJunos router: every
              stage&apos;s checks fail on the starting network and pass with the worked answer applied.
            </p>
          </section>
        </div>

        <aside className="grid content-start gap-4 lg:sticky lg:top-4">
          <div className="grid gap-3 rounded-lg border border-line bg-card p-4">
            <h2 className="m-0 text-lg font-bold">Download</h2>
            <p className="m-0 text-sm text-quiet">
              <strong className="text-ink">{lab.collection.access.name}.</strong> {lab.collection.access.note}
            </p>
            {released && lab.release.download ? (
              <>
                <a
                  href={downloadPath("lab", lab.id)}
                  className="inline-flex min-h-11 items-center justify-center rounded border border-accent bg-accent px-4 font-semibold text-on-accent no-underline"
                >
                  Download the lab
                </a>
                <p className="m-0 text-sm text-quiet">
                  <code>{lab.release.download.fileName}</code>, {formatBytes(lab.release.download.bytes)}. Leave the
                  file as it is: the app opens it.
                </p>
                {lab.release.needsApp ? (
                  <p className="m-0 text-sm text-quiet">
                    <strong className="text-ink">Needs version {lab.release.needsApp} of the app or later.</strong> An
                    earlier copy offers the update when it opens.
                  </p>
                ) : null}
                <details className="text-sm">
                  <summary className="cursor-pointer text-quiet">SHA-256</summary>
                  <div className="relative mt-2 rounded border border-line bg-surface p-2 pr-20 font-mono text-xs break-all">
                    {lab.release.download.sha256}
                    <CopyButton text={lab.release.download.sha256} />
                  </div>
                </details>
              </>
            ) : (
              <>
                <p className="m-0 text-[0.95rem]">
                  <strong>Not released yet.</strong> This lab is in its final review and opens for download when it is
                  released.
                </p>
                <span
                  aria-disabled="true"
                  className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded border border-line bg-surface px-4 font-semibold text-quiet"
                >
                  Download opens at release
                </span>
              </>
            )}
            <p className="m-0 text-sm">
              You also need the free Full Mesh Labs app.{" "}
              <Link href="/client" className="font-semibold text-ink underline underline-offset-2">Get the app</Link>
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-line bg-card p-4">
            <h2 className="m-0 text-lg font-bold">What you need</h2>
            <dl className="m-0 grid gap-2.5 text-sm">
              {lab.prerequisites ? (
                <div>
                  <dt className="font-semibold">What you should know first</dt>
                  <dd className="m-0 text-quiet">{lab.prerequisites}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-semibold">The app</dt>
                <dd className="m-0 text-quiet">The free Full Mesh Labs app, for {catalog.client.platform}.</dd>
              </div>
              <div>
                <dt className="font-semibold">The router image</dt>
                <dd className="m-0 text-quiet">
                  {lab.requirements.image.vendor}&apos;s free {lab.requirements.image.product}{" "}
                  {lab.requirements.image.version} image, about 4 GB. The app shows you where to get it, once.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Your computer</dt>
                <dd className="m-0 text-quiet">
                  12 GB of memory or more, with about {lab.requirements.minimumFreeMemoryGb} GB free while the lab
                  runs, and {lab.requirements.minimumCores} processor cores. The app checks this for you.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Time</dt>
                <dd className="m-0 text-quiet">
                  About {lab.estimatedMinutes} minutes of work, after a start of 10 to 25 minutes while the router
                  boots.
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
