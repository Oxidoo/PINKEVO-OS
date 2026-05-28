import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/server";
import { getLeads, getUpcomingFollowups } from "@/lib/crm/leads";
import { CsvImportDialog } from "./csv-import-dialog";
import { LeadCreateDialog } from "./lead-create-dialog";
import { LeadsBoard } from "./leads-board";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  await requireUser();
  const [leads, followups] = await Promise.all([getLeads(), getUpcomingFollowups()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leads"
        description={`${leads.length} lead${leads.length > 1 ? "s" : ""} · glissez les cartes pour changer de statut`}
        action={
          <div className="flex gap-2">
            <CsvImportDialog />
            <LeadCreateDialog />
          </div>
        }
      />
      <LeadsBoard leads={leads} followups={followups} />
    </div>
  );
}
