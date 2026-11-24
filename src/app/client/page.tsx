import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { GUIDE_STEPS, GuideStrip } from "@/components/guide-steps";
import { formatBytes } from "@/lib/catalog";
import { downloadPath, getCatalog } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get the app",
  description: "Download the Full Mesh Labs app (beta) for Windows 11: it runs a real Juniper router on your computer and guides you through each lab.",
};

export default function ClientPage() {
  const { client } = getCatalog();
  const hosted = Boolean(client.url);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 sm:px-6">
      <header className="grid gap-3">
        <p className="m-0 text-sm font-semibold text-quiet">
          {client.name} {client.channel} for {client.platform}
        </p>
        <h1 className="m-0 text-[1.9rem] leading-tight font-bold sm:text-[2.3rem]">Get the Full Mesh Labs app</h1>
        <p className="m-0 max-w-2xl text-lg text-quiet">
          The app runs a real Juniper router on your own computer. It walks you through setting up, opens the
          lab&apos;s workbook beside the router&apos;s terminals, and checks each stage when you ask.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-10">
          <section aria-labelledby="setup" className="grid gap-4">
            <h2 id="setup" className="m-0 text-xl font-bold">
              Set up, in about five minutes plus one download
            </h2>
            <ol className="m-0 grid list-none gap-4 p-0">
              <li className="flex gap-3">
                <span className="step-n current" aria-hidden>
                  1
                </span>
                <div className="grid gap-1">
                  <h3 className="m-0 text-base font-bold">Unzip it and open the app</h3>
                  <p className="m-0 text-quiet">
                    Right-click the zip and choose <strong className="text-ink">Extract All</strong>. Open the{" "}
                    <code>FullMeshLabs</code> folder inside and run <code>FullMeshLabs.exe</code>. If Windows asks, the publisher
                    is <strong className="text-ink">{client.publisher}</strong>: choose{" "}
                    <strong className="text-ink">Run</strong>.
                  </p>
                  <p className="m-0 text-sm text-quiet">
                    Want a desktop shortcut? Before you extract, right-click the zip, choose{" "}
                    <strong className="text-ink">Properties</strong> and tick{" "}
                    <strong className="text-ink">Unblock</strong>. Otherwise Windows can refuse a shortcut to a
                    program it still marks as downloaded.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="step-n" aria-hidden>
                  2
                </span>
                <div className="grid w-full min-w-0 gap-3">
                  <h3 className="m-0 text-base font-bold">Follow the app&apos;s guide</h3>
                  <GuideStrip />
                  <ol className="m-0 grid list-none gap-2 p-0 text-quiet">
                    {GUIDE_STEPS.map((s) => (
                      <li key={s.name}>
                        <strong className="text-ink">{s.name}.</strong> {s.text}
                      </li>
                    ))}
                  </ol>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="step-n" aria-hidden>
                  3
                </span>
                <div className="grid gap-1">
                  <h3 className="m-0 text-base font-bold">Let the router start</h3>
                  <p className="m-0 text-quiet">
                    Junos takes 10 to 25 minutes to start, and the screen can stay the same for a long stretch. That is
                    normal. The workbook is open while you wait.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section aria-labelledby="expect" className="grid gap-3">
            <h2 id="expect" className="m-0 text-xl font-bold">
              What to expect
            </h2>
            <ul className="m-0 grid list-disc gap-2 pl-5 text-quiet">
              <li>Keep a laptop plugged in, and close games and screen recorders while the router starts. They can make the start stall.</li>
              <li>If a start stalls, the app starts it again by itself.</li>
              <li>
                The app looks for a newer version when it opens. When there is one, it asks when to install it: now,
                when you close, or the next time you open. You can turn the check off in Settings.
              </li>
              <li>
                In the lab, the workbook sits beside the router&apos;s terminals. Each stage has a{" "}
                <strong className="text-ink">Check</strong> button that ticks what you got right.
              </li>
              <li>
                <strong className="text-ink">Stop lab</strong>, or closing the window, stops the router. Changes you
                made on the router are not kept.
              </li>
            </ul>
          </section>

          <section aria-labelledby="help" className="grid gap-3">
            <h2 id="help" className="m-0 text-xl font-bold">
              If something goes wrong
            </h2>
            <p className="m-0 max-w-2xl text-quiet">
              Use the <strong className="text-ink">Feedback</strong>{" "}button at the top of the app&apos;s window, write
              what happened and choose <strong className="text-ink">Send report</strong>. It comes straight to us, and
              nothing is sent until you press it.
            </p>
            <p className="m-0 max-w-2xl text-quiet">
              To remove the app, delete the <code>FullMeshLabs</code> folder and the folder <code>.config\labpack</code> in
              your user folder.
            </p>
          </section>
        </div>

        <aside className="grid content-start gap-4 lg:sticky lg:top-4">
          <div className="grid gap-3 rounded-lg border border-line bg-card p-4">
            <h2 className="m-0 text-lg font-bold">Download</h2>
            {hosted ? (
              <>
                <a
                  href={downloadPath("client")}
                  className="inline-flex min-h-11 items-center justify-center rounded border border-accent bg-accent px-4 font-semibold text-on-accent no-underline"
                >
                  Download the app
                </a>
                <p className="m-0 rounded border border-not-yet bg-not-yet-soft px-3 py-2 text-sm">
                  <strong>This is a beta.</strong> The app is an early version and not a finished product yet. It
                  works, but expect rough edges and changes. When a newer version is out, the app asks to install it.
                </p>
              </>
            ) : (
              <>
                <p className="m-0 text-[0.95rem]">
                  <strong>Not open to everyone yet.</strong> The beta is with a small group of testers first. The
                  download opens here with the first labs.
                </p>
                <span
                  aria-disabled="true"
                  className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded border border-line bg-surface px-4 font-semibold text-quiet"
                >
                  Download opens soon
                </span>
              </>
            )}
            <p className="m-0 text-sm text-quiet">
              Version {client.version} ({client.channel}). <code className="break-all">{client.fileName}</code>,{" "}
              {formatBytes(client.bytes)}. Signed by {client.publisher}.
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer text-quiet">SHA-256</summary>
              <div className="relative mt-2 rounded border border-line bg-surface p-2 pr-20 font-mono text-xs break-all">
                {client.sha256}
                <CopyButton text={client.sha256} />
              </div>
            </details>
          </div>

          <div className="grid gap-3 rounded-lg border border-line bg-card p-4">
            <h2 className="m-0 text-lg font-bold">You need</h2>
            <ul className="m-0 grid list-disc gap-1.5 pl-5 text-sm text-quiet">
              {client.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="m-0 text-sm text-quiet">The app is for Windows 11 for now.</p>
          </div>

          <p className="m-0 text-sm">
            Next: <Link href="/#labs" className="font-semibold text-ink underline underline-offset-2">choose a lab</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
