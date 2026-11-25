import type { Metadata } from "next";
import Link from "next/link";
import { STAGES } from "@/lib/catalog";
import { getCatalog } from "@/lib/site";

export const metadata: Metadata = {
  title: "Getting started",
  description: "Four steps from nothing to your first Junos lab with the Full Mesh Labs app.",
};

const STEPS = [
  {
    title: "Get the app",
    body: "The Full Mesh Labs app is free, for Windows 11. It is a beta: an early version that is still changing. It needs 12 GB of memory or more and about 12 GB of free disk space.",
    link: { href: "/client", label: "Get the app" },
  },
  {
    title: "Choose a lab",
    body: "Pick a lab and download its .labpack file. It is one small file with the network, the workbook and the checks inside. Leave it as it is.",
    link: { href: "/#labs", label: "Browse the labs" },
  },
  {
    title: "Open it in the app",
    body: "The app's guide checks your computer for that lab and helps you get Juniper's free router image, about 4 GB. You fetch the image once; every lab uses it.",
  },
  {
    title: "Start the lab and work through it",
    body: "The router takes 10 to 25 minutes to start; read the workbook meanwhile. Then work stage by stage and press Check to see what you got right. Stop lab when you finish: nothing you changed is kept, so every start is fresh.",
  },
];

export default function StartPage() {
  const catalog = getCatalog();
  const tier = new Map(catalog.access.map((a) => [a.id, a]));
  // One column per run of stages that the access rule treats alike, named by the levels in it.
  const groups: { label: string; stage: (typeof STAGES)[number] }[] = [];
  let run: (typeof STAGES)[number][] = [];
  const same = (a: (typeof STAGES)[number], b: (typeof STAGES)[number]) =>
    catalog.accessRule.course[a] === catalog.accessRule.course[b] && catalog.accessRule.library[a] === catalog.accessRule.library[b];
  const close = () => {
    if (!run.length) return;
    const names = catalog.levels.filter((l) => run.includes(l.stage)).map((l) => l.name.split("-")[0]);
    groups.push({ label: [...new Set(names)].join(" and ") || run.join(" and "), stage: run[0] });
    run = [];
  };
  for (const stage of STAGES) {
    if (run.length && !same(run[0], stage)) close();
    run.push(stage);
  }
  close();
  return (
    <div className="mx-auto grid max-w-3xl gap-10 px-4 pt-8 sm:px-6">
      <header className="grid gap-3">
        <h1 className="m-0 text-[1.9rem] leading-tight font-bold sm:text-[2.3rem]">Getting started</h1>
        <p className="m-0 text-lg text-quiet">Four steps from nothing to your first lab.</p>
      </header>

      <ol className="m-0 grid list-none gap-4 p-0">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-lg border border-line bg-card p-4 sm:p-5">
            <span className={`step-n ${i === 0 ? "current" : ""}`} aria-hidden>
              {i + 1}
            </span>
            <div className="grid gap-1.5">
              <h2 className="m-0 text-lg font-bold">{s.title}</h2>
              <p className="m-0 text-quiet">{s.body}</p>
              {s.link ? (
                <p className="m-0">
                  <Link href={s.link.href} className="font-semibold text-ink underline underline-offset-2">
                    {s.link.label}
                  </Link>
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <section aria-labelledby="access" className="grid gap-3">
        <h2 id="access" className="m-0 text-xl font-bold">
          What each lab needs
        </h2>
        <div className="overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="text-quiet">
                <th className="px-4 py-2.5 font-semibold" />
                {groups.map((g) => (
                  <th key={g.label} className="px-4 py-2.5 font-semibold">
                    {g.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["course", "library"] as const).map((kind) => (
                <tr key={kind} className="border-t border-line">
                  <th className="px-4 py-2.5 font-semibold">{kind === "course" ? "Course labs" : "Practice library"}</th>
                  {groups.map((g) => (
                    <td key={g.label} className="px-4 py-2.5 text-quiet">
                      {tier.get(catalog.accessRule[kind][g.stage])?.name}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-sm text-quiet">The app itself is free and needs no account.</p>
      </section>

      <section aria-labelledby="good-to-know" className="grid gap-3">
        <h2 id="good-to-know" className="m-0 text-xl font-bold">
          Good to know
        </h2>
        <ul className="m-0 grid list-disc gap-2 pl-5 text-quiet">
          <li>
            It is a real router. What you type is real Junos and what comes back is real output, so the labs prepare
            you for real equipment as well as for the exam.
          </li>
          <li>
            One virtual router runs each lab. The other devices in the drawing run inside it as logical systems, which
            is how a whole network fits on a laptop.
          </li>
          <li>Keep a laptop plugged in, and close games and screen recorders while the router starts.</li>
          <li>
            The labs are practice. The course labs go with the JNCIA-Junos video course; the practice library stands on
            its own.
          </li>
        </ul>
      </section>
    </div>
  );
}
