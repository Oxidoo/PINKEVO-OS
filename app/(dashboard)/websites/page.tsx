import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/server";
import { getClients } from "@/lib/crm/clients";
import { getWebsitesWithScores } from "@/lib/websites/queries";
import { WebsiteCreateDialog } from "./website-create-dialog";

export const metadata = { title: "Sites" };

function ScorePill({ label, score }: { label: string; score: number | null }) {
  const color =
    score === null
      ? "bg-muted text-muted-foreground"
      : score >= 90
        ? "bg-success/15 text-success"
        : score >= 70
          ? "bg-warning/15 text-warning"
          : "bg-destructive/15 text-destructive";
  return (
    <div className={`rounded-md px-2 py-1 text-center text-xs ${color}`}>
      <span className="font-semibold tabular-nums">{score ?? "—"}</span>
      <span className="ml-1 opacity-70">{label}</span>
    </div>
  );
}

export default async function WebsitesPage() {
  await requireUser();
  const [sites, clients] = await Promise.all([getWebsitesWithScores(), getClients()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sites"
        description={`${sites.length} site${sites.length > 1 ? "s" : ""} livré${sites.length > 1 ? "s" : ""} / suivi${sites.length > 1 ? "s" : ""}`}
        action={<WebsiteCreateDialog clients={clients.map((c) => ({ id: c.id, name: c.name }))} />}
      />
      {sites.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Aucun site. Ajoutez les sites livrés à vos clients.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((w) => (
            <Link key={w.id} href={`/websites/${w.id}`}>
              <Card className="h-full transition hover:border-brand-300 hover:shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{w.name}</CardTitle>
                    {w.monitoringEnabled && (
                      <Badge variant="secondary" className="text-[10px]">
                        Suivi
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{w.url}</p>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <ScorePill label="SEO" score={w.seoScore} />
                  <ScorePill label="Perf" score={w.perfScore} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
