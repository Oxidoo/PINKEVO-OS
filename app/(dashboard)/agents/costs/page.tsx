import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAgentsWithStats, getAiCostBreakdown } from "@/lib/ai/runs";
import { requireUser } from "@/lib/auth/server";

export const metadata = { title: "Coûts IA" };

export default async function AiCostsPage() {
  await requireUser();
  const [{ byDay, byAgent }, agents] = await Promise.all([
    getAiCostBreakdown(),
    getAgentsWithStats(),
  ]);

  const agentName = new Map(agents.map((a) => [a.id, a.name]));
  const totalMonth = byAgent.reduce((s, r) => s + Number(r.cost), 0);

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/agents">
          <ArrowLeft className="mr-1 size-4" /> Agents
        </Link>
      </Button>
      <PageHeader title="Coûts IA" description={`Total ce mois : $${totalMonth.toFixed(2)}`} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Par agent (ce mois)</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byAgent.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Aucune exécution ce mois
                    </TableCell>
                  </TableRow>
                ) : (
                  byAgent.map((r) => (
                    <TableRow key={r.agentId}>
                      <TableCell>{agentName.get(r.agentId) ?? r.agentId}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.runs}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${Number(r.cost).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Par jour / provider</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDay.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Aucune donnée
                    </TableCell>
                  </TableRow>
                ) : (
                  byDay.map((r) => (
                    <TableRow key={`${r.date}-${r.provider}`}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell className="capitalize">{r.provider}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(r.tokens).toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${Number(r.cost).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
