import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth/server";
import { getCostsOverview, getMarginSeries, getRevenueOverview } from "@/lib/finance/queries";
import { formatCurrency } from "@/lib/format";
import { AddExpenseDialog, AddToolDialog } from "./finance-dialogs";
import { MarginChart } from "./margin-chart";

export const metadata = { title: "Finance" };

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default async function FinancePage() {
  // Finance is owner/admin only.
  await requireRole(["owner", "admin"]);
  const [revenue, costs, series] = await Promise.all([
    getRevenueOverview(),
    getCostsOverview(),
    getMarginSeries(),
  ]);

  const monthlyCost = costs.toolMonthly + costs.apiMonthly;
  const margin = revenue.mrr - monthlyCost;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Finance" description="Revenus, coûts et marge de l'agence" />

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="costs">Coûts</TabsTrigger>
          <TabsTrigger value="margin">Marge</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="MRR" value={formatCurrency(revenue.mrr)} />
            <Kpi label="ARR" value={formatCurrency(revenue.arr)} />
            <Kpi label="Clients actifs" value={String(revenue.activeClients)} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Factures récentes</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="hidden md:table-cell">Émise</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenue.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Aucune facture (sync via webhook Stripe)
                      </TableCell>
                    </TableRow>
                  ) : (
                    revenue.invoices.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.number ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{i.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(i.total, i.currency)}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {i.issuedAt ? format(i.issuedAt, "d MMM yyyy", { locale: fr }) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Outils / mois" value={formatCurrency(costs.toolMonthly)} />
            <Kpi label="API / mois" value={`$${costs.apiMonthly.toFixed(2)}`} />
            <Kpi label="Total coûts / mois" value={formatCurrency(monthlyCost)} />
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Abonnements outils</CardTitle>
              <div className="flex gap-2">
                <AddToolDialog />
                <AddExpenseDialog />
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outil</TableHead>
                    <TableHead>Éditeur</TableHead>
                    <TableHead className="text-right">Sièges</TableHead>
                    <TableHead className="text-right">Coût / mois</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.tools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Aucun outil. Ajoutez vos abonnements.
                      </TableCell>
                    </TableRow>
                  ) : (
                    costs.tools.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-muted-foreground">{t.vendor ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{t.seats ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(t.monthlyCost)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margin" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="MRR" value={formatCurrency(revenue.mrr)} />
            <Kpi label="Coûts / mois" value={formatCurrency(monthlyCost)} />
            <Kpi
              label="Marge / mois"
              value={formatCurrency(margin)}
              sub={revenue.mrr > 0 ? `${Math.round((margin / revenue.mrr) * 100)}%` : undefined}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CA vs coûts (12 mois)</CardTitle>
            </CardHeader>
            <CardContent>
              <MarginChart data={series} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
