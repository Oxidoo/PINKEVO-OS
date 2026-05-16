import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/server";
import { getAutomations } from "@/lib/automations/actions";
import { AUTOMATION_TEMPLATES } from "@/lib/automations/templates";
import { AutomationsClient } from "./automations-client";

export const metadata = { title: "Automatisations" };

export default async function AutomationsPage() {
  await requireRole(["owner", "admin", "manager"]);
  const items = await getAutomations();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Automatisations"
        description="Workflows événementiels — trigger + étapes, exécutés via Inngest ou inline"
      />
      <AutomationsClient
        automations={items.map((a) => ({
          id: a.id,
          name: a.name,
          triggerType: a.triggerType,
          enabled: a.enabled,
          steps: (a.steps ?? []) as { kind: string }[],
          lastRunAt: a.lastRunAt ? a.lastRunAt.toISOString() : null,
        }))}
        templates={AUTOMATION_TEMPLATES.map((t) => ({
          slug: t.slug,
          name: t.name,
          description: t.description,
        }))}
      />
    </div>
  );
}
