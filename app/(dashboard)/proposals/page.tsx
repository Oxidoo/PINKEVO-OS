import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/server";
import { formatCurrency } from "@/lib/format";
import { getProposals } from "@/lib/proposals/actions";
import { ProposalRowActions } from "./proposal-actions";

export const metadata = { title: "Propositions" };

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  sent: "outline",
  viewed: "outline",
  accepted: "default",
  rejected: "secondary",
};

export default async function ProposalsPage() {
  await requireUser();
  const items = await getProposals();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Propositions"
        description="Propales générées (agent) — PDF & signature électronique"
      />
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Aucune proposition. L&apos;agent « proposal_writer » en crée automatiquement.
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Setup</TableHead>
                <TableHead className="text-right">Récurrent</TableHead>
                <TableHead className="hidden md:table-cell">Créée</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.totalSetup)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.totalRecurring)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {format(p.createdAt, "d MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <ProposalRowActions id={p.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
