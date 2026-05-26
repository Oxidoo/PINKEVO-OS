import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getModelOption } from "@/lib/ai/models";
import { availableProviders } from "@/lib/ai/provider";
import { getAgentRuns } from "@/lib/ai/runs";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { agents } from "@/lib/db/schema";
import { LaunchDialog } from "../launch-dialog";
import { ConfigForm } from "./config-form";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  success: "default",
  running: "secondary",
  queued: "outline",
  failed: "destructive",
};

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, slug as (typeof agents.slug.enumValues)[number]))
    .limit(1);
  if (!agent) notFound();
  const runs = await getAgentRuns(agent.id);
  const providers = availableProviders();
  const noLlm = !providers.anthropic && !providers.openai;
  const modelLabel = getModelOption(agent.model)?.label ?? agent.model;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/agents">
            <ArrowLeft className="mr-1 size-4" /> Agents
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{agent.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {modelLabel}
            </Badge>
            <LaunchDialog
              slug={agent.slug}
              disabled={!agent.enabled || noLlm}
              defaultModel={agent.model}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Historique ({runs.length})</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="mt-6 space-y-3">
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune exécution.</p>
          ) : (
            runs.map((r) => {
              const out = (r.output ?? {}) as { summary?: string; model?: string };
              const runModel = out.model
                ? (getModelOption(out.model)?.label ?? out.model)
                : null;
              return (
                <div key={r.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>{r.status}</Badge>
                      {runModel && (
                        <Badge variant="outline" className="text-[10px]">
                          {runModel}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(r.createdAt, "d MMM HH:mm", { locale: fr })}
                    </span>
                  </div>
                  {out.summary && <p className="mt-2 text-sm">{out.summary}</p>}
                  {r.error && <p className="mt-2 text-sm text-destructive">{r.error}</p>}
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground tabular-nums">
                    <span>{(r.tokensInput ?? 0) + (r.tokensOutput ?? 0)} tokens</span>
                    <span>${Number(r.costUsd ?? 0).toFixed(4)}</span>
                    <span>{r.durationMs ?? 0} ms</span>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="config" className="mt-6 max-w-2xl">
          <ConfigForm agent={agent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
