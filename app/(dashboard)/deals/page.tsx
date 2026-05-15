import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/server";
import { getClients } from "@/lib/crm/clients";
import { getDeals } from "@/lib/crm/deals";
import { DealCreateDialog } from "./deal-create-dialog";
import { DealsBoard } from "./deals-board";

export const metadata = { title: "Deals" };

export default async function DealsPage() {
  await requireUser();
  const [deals, clients] = await Promise.all([getDeals(), getClients()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Deals"
        description="Pipeline commercial · glissez les cartes entre les étapes"
        action={<DealCreateDialog clients={clients.map((c) => ({ id: c.id, name: c.name }))} />}
      />
      <DealsBoard deals={deals} />
    </div>
  );
}
