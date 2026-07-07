import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, ShieldCheck, Terminal } from "lucide-react";
import { TopologyDiagram } from "@/components/topology-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLab, labs } from "@/lib/labs";

export function generateStaticParams() {
  return labs.map((lab) => ({ slug: lab.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lab = getLab(slug);
  return {
    title: lab ? `${lab.title} | LabSmith Lab Library` : "Lab not found",
    description: lab?.summary,
  };
}

export default async function LabPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lab = getLab(slug);

  if (!lab) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to catalog
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-6">
            <Card>
              <CardContent className="space-y-5 p-6">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={lab.status === "Verified" ? "default" : "secondary"}
                    className={
                      lab.status === "Verified"
                        ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-500"
                        : undefined
                    }
                  >
                    {lab.status}
                  </Badge>
                  <Badge variant="outline">{lab.nodeCount} nodes</Badge>
                  <Badge variant="outline">{lab.difficulty}</Badge>
                  <Badge variant="outline">{lab.topologyFamily}</Badge>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {lab.title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {lab.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lab.technologies.map((technology) => (
                    <Badge key={technology} variant="secondary">
                      {technology}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="flex h-auto flex-wrap justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="topology">Topology</TabsTrigger>
                <TabsTrigger value="configs">Device Configs</TabsTrigger>
                <TabsTrigger value="exercise">Guided Exercise</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="downloads">Downloads</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Scenario Map</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    {lab.scenarios.map((scenario) => (
                      <div key={scenario} className="rounded-md border bg-card p-4">
                        <p className="text-sm font-medium">{scenario}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="topology">
                <Card>
                  <CardHeader>
                    <CardTitle>Runnable Containerlab Topology</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 xl:grid-cols-[1fr_420px]">
                    <CodeBlock value={lab.topology} />
                    <TopologyDiagram lab={lab} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="configs">
                <Tabs defaultValue={lab.configs[0]?.device} className="space-y-4">
                  <TabsList className="flex h-auto flex-wrap justify-start">
                    {lab.configs.map((config) => (
                      <TabsTrigger key={config.device} value={config.device}>
                        {config.device}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {lab.configs.map((config) => (
                    <TabsContent key={config.device} value={config.device}>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Terminal className="h-4 w-4" />
                            {config.device} <span className="text-muted-foreground">({config.role})</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CodeBlock value={config.content} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>

              <TabsContent value="exercise">
                <div className="space-y-4">
                  {lab.exercise.map((step, index) => (
                    <Card key={step.title}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Step {index + 1}: {step.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm leading-6 text-muted-foreground">{step.why}</p>
                        <CodeBlock value={step.commands.join("\n")} />
                        <div className="rounded-md border bg-muted/30 p-4 text-sm">
                          <span className="font-medium">Expected result: </span>
                          {step.expected}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="verification">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      Verification Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <dl className="grid gap-3 md:grid-cols-3">
                      <Info label="Last run" value={lab.verification.lastRun} />
                      <Info label="Mode" value={lab.verification.mode} />
                      <Info label="Assertions" value={lab.verification.assertions} />
                    </dl>
                    <Separator />
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {lab.verification.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="downloads">
                <Card>
                  <CardHeader>
                    <CardTitle>Use This Lab</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md border bg-muted/30 p-4">
                      <CodeBlock
                        value={`git clone https://github.com/jncia/labsmith-lab-library.git
cd labsmith-lab-library/content/labs/${lab.slug}
containerlab deploy -t topology.clab.yml`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild>
                        <a href={lab.repositoryPath} target="_blank" rel="noreferrer">
                          Open lab files <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href={`${lab.repositoryPath}/topology.clab.yml`} target="_blank" rel="noreferrer">
                          Topology file <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Lab Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <Info label="Vendor" value={lab.vendor} />
                  <Info label="Topology" value={lab.topologyFamily} />
                  <Info label="Difficulty" value={lab.difficulty} />
                  <Info label="Primary format" value="Containerlab" />
                </dl>
              </CardContent>
            </Card>
            <TopologyDiagram lab={lab} />
          </aside>
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function CodeBlock({ value }: { value: string }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-md border bg-black/40 p-4 font-mono text-xs leading-5 text-zinc-100">
      <code>{value}</code>
    </pre>
  );
}
