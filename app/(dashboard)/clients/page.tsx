import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/server";
import { getClients } from "@/lib/crm/clients";
import { ClientsView } from "./clients-view";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  await requireUser();
  const clients = await getClients();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length > 1 ? "s" : ""} · CRM PINKEVO`}
      />
      <ClientsView clients={clients} />
    </div>
  );
}
