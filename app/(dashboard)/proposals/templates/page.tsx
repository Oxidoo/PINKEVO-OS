import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Plus } from "lucide-react";
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
import { getProposalTemplates } from "@/lib/proposals/templates";

export const metadata = { title: "Templates de devis" };

export default async function ProposalTemplatesPage() {
  await requireUser();
  const templates = await getProposalTemplates();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/proposals">
            <ArrowLeft className="mr-1 size-4" /> Devis
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Templates de devis"
        description="Modèles réutilisables. Variables `{{client}}` `{{date}}` `{{societe}}` substituées à la création."
        action={
          <Button asChild>
            <Link href="/proposals/templates/new">
              <Plus className="mr-1 size-4" /> Nouveau template
            </Link>
          </Button>
        }
      />
      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Aucun template.{" "}
          <Link href="/proposals/templates/new" className="text-brand-600 hover:underline">
            Créez-en un pour démarrer
          </Link>
          .
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Setup défaut</TableHead>
                <TableHead className="text-right">Récurrent défaut</TableHead>
                <TableHead className="hidden md:table-cell">Variables</TableHead>
                <TableHead className="hidden md:table-cell">Modifié</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => {
                const setup = t.sections.lineItems
                  .filter((i) => i.group === "setup")
                  .reduce((s, i) => s + Number(i.unitPrice), 0);
                const recurring = t.sections.lineItems
                  .filter((i) => i.group === "recurring")
                  .reduce((s, i) => s + Number(i.unitPrice), 0);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/proposals/templates/${t.id}`}
                        className="hover:underline"
                      >
                        {t.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.slug}</code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(setup)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(recurring)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {t.variables.slice(0, 5).map((v) => (
                          <Badge key={v} variant="outline" className="text-[10px]">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {format(t.updatedAt, "d MMM yyyy", { locale: fr })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
