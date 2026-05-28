import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getClients } from "@/lib/crm/clients";
import { getLeads } from "@/lib/crm/leads";
import { listPaymentLinks, stripeConfigured } from "@/lib/integrations/stripe/client";
import { getProposalTemplates } from "@/lib/proposals/templates";
import { ProposalForm } from "./proposal-form";

export const metadata = { title: "Nouveau devis" };

function leadName(l: {
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  email: string | null;
}) {
  const n = `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim();
  return n || l.company || l.email || "Lead sans nom";
}

export default async function NewProposalPage() {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const [templates, clients, leads, paymentLinks] = await Promise.all([
    getProposalTemplates(),
    getClients(),
    getLeads(),
    listPaymentLinks().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/proposals">
            <ArrowLeft className="mr-1 size-4" /> Devis
          </Link>
        </Button>
      </div>
      <PageHeader title="Nouveau devis" description="Choisissez un template puis remplissez les variables." />

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Aucun template.{" "}
          <Link href="/proposals/templates/new" className="text-brand-600 hover:underline">
            Créez-en un d&apos;abord
          </Link>
          .
        </div>
      ) : (
        <ProposalForm
          templates={templates.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            variables: t.variables,
            lineItems: t.sections.lineItems,
          }))}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          leads={leads.map((l) => ({ id: l.id, name: leadName(l) }))}
          paymentLinks={paymentLinks}
          stripeReady={stripeConfigured()}
        />
      )}
    </div>
  );
}
