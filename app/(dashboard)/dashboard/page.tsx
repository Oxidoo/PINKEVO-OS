import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/server";
import { getDashboardData } from "@/lib/dashboard/queries";
import { MarginChart } from "../finance/margin-chart";
import { KpiCard } from "./kpi-card";
import { WinsCarousel } from "./wins-carousel";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const profile = await requireUser();
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tableau de bord"
        description={`Bonjour ${profile.fullName ?? ""} — l'état de l'agence en un coup d'œil`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="MRR" value={data.kpis.mrr} currency />
        <KpiCard label="Clients actifs" value={data.kpis.activeClients} />
        <KpiCard label="Leads chauds" value={data.kpis.hotLeads} />
        <KpiCard label="Marge du mois" value={data.kpis.monthMargin} currency />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">CA vs coûts (6 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <MarginChart
              data={data.series.map((s) => ({
                ...s,
                margin: s.revenue - s.cost,
              }))}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <WinsCarousel wins={data.wins} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">À faire aujourd&apos;hui</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Leads à relancer</span>
                <Badge variant="secondary">{data.todo.leadsToFollow}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Propales en attente</span>
                <Badge variant="secondary">{data.todo.proposalsPending}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
          ) : (
            <ul className="space-y-3">
              {data.recent.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {a.type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{a.subject || a.content || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.at), { locale: fr, addSuffix: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
