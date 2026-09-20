import { Activity, Boxes, GitBranch, Network, ShieldCheck } from "lucide-react";
import { LabCatalog } from "@/components/lab-catalog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { labs } from "@/lib/labs";

export default function Home() {
  const verifiedCount = labs.filter((lab) => lab.status === "Verified").length;
  const nodeTotal = labs.reduce((total, lab) => total + lab.nodeCount, 0);
  const technologyTotal = new Set(labs.flatMap((lab) => lab.technologies)).size;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b bg-card/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-emerald-400/40 text-emerald-300">
                  Verified on real Junos
                </Badge>
                <Badge variant="secondary">Free & runnable</Badge>
                <Badge variant="secondary">Containerlab first</Badge>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                  LabSmith Lab Library
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Runnable networking labs with topology files, per-device
                  configurations, and workbook tasks with answers — every
                  verified lab was deployed and checked on live virtual Junos
                  devices before publishing.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:min-w-[420px]">
              <Metric icon={ShieldCheck} label="Verified" value={verifiedCount.toString()} />
              <Metric icon={Network} label="Nodes" value={nodeTotal.toString()} />
              <Metric icon={Boxes} label="Topics" value={technologyTotal.toString()} />
            </div>
          </div>
          <Separator />
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="bg-card/70">
              <CardContent className="flex items-center gap-3 p-4">
                <Activity className="h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-sm font-medium">Machine-verified, not hand-written</p>
                  <p className="text-xs text-muted-foreground">
                    Configs applied, state asserted, outputs captured live.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/70">
              <CardContent className="flex items-center gap-3 p-4">
                <GitBranch className="h-5 w-5 text-sky-300" />
                <div>
                  <p className="text-sm font-medium">Git-native delivery</p>
                  <p className="text-xs text-muted-foreground">
                    Every lab lives as readable files in the repo.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/70">
              <CardContent className="flex items-center gap-3 p-4">
                <Network className="h-5 w-5 text-amber-300" />
                <div>
                  <p className="text-sm font-medium">Home-lab friendly</p>
                  <p className="text-xs text-muted-foreground">
                    Six-node ceiling, Containerlab topology first.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <LabCatalog labs={labs} />
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
}) {
  return (
    <Card className="bg-background/70">
      <CardContent className="p-4">
        <Icon className="mb-3 h-4 w-4 text-muted-foreground" />
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
