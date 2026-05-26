import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { availableProviders } from "@/lib/ai/provider";
import { getAgentsWithStats } from "@/lib/ai/runs";
import { requireUser } from "@/lib/auth/server";
import { LaunchDialog } from "./launch-dialog";

export const metadata = { title: "Agents IA" };

export default async function AgentsPage() {
  await requireUser();
  const agents = await getAgentsWithStats();
  const providers = availableProviders();
  const noLlm = !providers.anthropic && !providers.openai;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Agents IA"
        description="5 agents autonomes · exécution tracée (tokens, coût, durée)"
        action={
          <Button asChild variant="outline">
            <Link href="/agents/costs">Coûts IA</Link>
          </Button>
        }
      />
      {noLlm && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div className="space-y-1">
            <p className="font-medium">Aucun fournisseur LLM configuré</p>
            <p className="text-muted-foreground">
              Définis <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY</code> ou{" "}
              <code className="rounded bg-muted px-1">OPENAI_API_KEY</code> dans les variables
              d&apos;environnement Vercel pour activer les agents. Sans clé, tout lancement
              échouera avec un message clair (plus de contenu mock silencieux).
            </p>
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => (
          <Card key={a.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  <Link href={`/agents/${a.slug}`} className="hover:underline">
                    {a.name}
                  </Link>
                </CardTitle>
                <Badge variant={a.enabled ? "default" : "outline"}>
                  {a.enabled ? "Actif" : "Off"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{a.description}</p>
            </CardHeader>
            <CardContent className="mt-auto space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold tabular-nums">{a.monthRuns}</p>
                  <p className="text-[10px] text-muted-foreground">runs / mois</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums">${a.monthCost.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">coût / mois</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums">
                    {a.successRate === null ? "—" : `${a.successRate}%`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">succès</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {a.lastRun
                  ? `Dernière exéc. ${formatDistanceToNow(new Date(a.lastRun), { locale: fr, addSuffix: true })}`
                  : "Jamais exécuté"}
              </p>
              <div className="flex gap-2">
                <LaunchDialog
                  slug={a.slug}
                  disabled={!a.enabled || noLlm}
                  defaultModel={a.model}
                />
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/agents/${a.slug}`}>Détails</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
