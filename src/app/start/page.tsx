import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Getting started",
  description: "Four steps from nothing to your first Junos lab in LabPack.",
};

const STEPS = [
  {
    title: "Get LabPack",
    body: "LabPack is a free app for Windows 11. It needs 12 GB of memory or more and about 12 GB of free disk space.",
    link: { href: "/client", label: "Get LabPack" },
  },
  {
    title: "Choose a lab",
    body: "Pick a lab and download its .labpack file. It is one small file with the network, the workbook and the checks inside. Leave it as it is.",
    link: { href: "/#labs", label: "Browse the labs" },
  },
  {
    title: "Open it in LabPack",
    body: "LabPack's guide checks your computer for that lab and helps you get Juniper's free router image, about 4 GB. You fetch the image once; every lab uses it.",
  },
  {
    title: "Start the lab and work through it",
    body: "The router takes 10 to 25 minutes to start; read the workbook meanwhile. Then work stage by stage and press Check to see what you got right. Stop lab when you finish: nothing you changed is kept, so every start is fresh.",
  },
];

export default function StartPage() {
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

      <section aria-labelledby="good-to-know" className="grid gap-3">
        <h2 id="good-to-know" className="m-0 text-xl font-bold">
          Good to know
        </h2>
        <ul className="m-0 grid gap-2 pl-5 text-quiet">
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
