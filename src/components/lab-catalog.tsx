"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Download, Filter, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Lab } from "@/lib/labs";

export function LabCatalog({ labs }: { labs: Lab[] }) {
  const [query, setQuery] = useState("");
  const [technology, setTechnology] = useState("all");
  const [topology, setTopology] = useState("all");

  const technologies = useMemo(
    () => Array.from(new Set(labs.flatMap((lab) => lab.technologies))).sort(),
    [labs],
  );
  const topologies = useMemo(
    () => Array.from(new Set(labs.map((lab) => lab.topologyFamily))).sort(),
    [labs],
  );

  const filteredLabs = labs.filter((lab) => {
    const haystack = [
      lab.title,
      lab.summary,
      lab.topologyFamily,
      lab.vendor,
      lab.difficulty,
      ...lab.technologies,
      ...lab.scenarios,
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesTechnology =
      technology === "all" || lab.technologies.includes(technology);
    const matchesTopology =
      topology === "all" || lab.topologyFamily === topology;
    return matchesQuery && matchesTechnology && matchesTopology;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4" />
              Find a scenario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="EVPN, Option B, RR..."
              />
            </div>
            <Select value={technology} onValueChange={setTechnology}>
              <SelectTrigger>
                <SelectValue placeholder="Technology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All technologies</SelectItem>
                {technologies.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={topology} onValueChange={setTopology}>
              <SelectTrigger>
                <SelectValue placeholder="Topology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topologies</SelectItem>
                {topologies.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Separator />
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>{filteredLabs.length} matching labs</p>
              <p>Primary format: Containerlab with startup configs.</p>
            </div>
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-4">
        {filteredLabs.map((lab) => (
          <Card key={lab.slug} className="overflow-hidden">
            <CardContent className="grid gap-4 p-0 md:grid-cols-[1fr_240px]">
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
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
                  <Badge variant="outline">{lab.vendor}</Badge>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">{lab.title}</h2>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {lab.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lab.technologies.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={`/labs/${lab.slug}`}>
                      Inspect lab <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={lab.repositoryPath} target="_blank" rel="noreferrer">
                      Lab files <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
              <div className="border-t bg-muted/30 p-5 md:border-l md:border-t-0">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Verification
                </div>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Last run</dt>
                    <dd className="font-mono text-xs">{lab.verification.lastRun}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Assertions</dt>
                    <dd>{lab.verification.assertions}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Topology family</dt>
                    <dd>{lab.topologyFamily}</dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
