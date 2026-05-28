import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getAgencySettings } from "@/lib/agency/settings";
import { requireRole } from "@/lib/auth/server";
import { BillingForm } from "./billing-form";

export const metadata = { title: "Facturation" };

export default async function BillingSettingsPage() {
  await requireRole(["owner", "admin"]);
  const settings = await getAgencySettings();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/settings">
            <ArrowLeft className="mr-1 size-4" /> Paramètres
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Facturation & infos prestataire"
        description="Ces infos apparaissent automatiquement dans les devis et factures."
      />
      <BillingForm initial={settings} />
    </div>
  );
}
