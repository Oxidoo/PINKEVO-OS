import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getProposalTemplates } from "@/lib/proposals/templates";
import { ProposalRowActions } from "./proposal-actions";

export const metadata = { title: "Propositions" };

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  sent: "outline",
  viewed: "outline",
  accepted: "default",
  rejected: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  viewed: "Consultée",
  accepted: "Signée",
  rejected: "Refusée",
};

export default async function ProposalsPage() {
  await requireUser();
  const [items, templates] = await Promise.all([getProposals(), getProposalTemplates()]);
  const canCreate = templates.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Devis"
        description="Devis créés depuis un template · PDF & signature électronique"
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/proposals/templates">
                <FileText className="mr-1 size-4" /> Templates
              </Link>
            </Button>
            <Button asChild disabled={!canCreate}>
              <Link href={canCreate ? "/proposals/new" : "/proposals/templates/new"}>
                <Plus className="mr-1 size-4" />
                {canCreate ? "Nouveau devis" : "Créer un template d'abord"}
              </Link>
            </Button>
          </>
        }
      />
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          {canCreate ? (
            <>
              Aucun devis pour l&apos;instant.{" "}
              <Link href="/proposals/new" className="text-brand-600 hover:underline">
                Créer le premier
              </Link>
              .
            </>
          ) : (
            <>
              Aucun template de devis.{" "}
              <Link href="/proposals/templates/new" className="text-brand-600 hover:underline">
                Créez-en un pour démarrer
              </Link>
              .
            </>
          )}
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
                <TableHead className="hidden md:table-cell">Créé</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
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
                    <ProposalRowActions id={p.id} status={p.status} />
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
