import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getProposalTemplate } from "@/lib/proposals/templates";
import { TemplateForm } from "../template-form";

export const metadata = { title: "Éditer template" };

export default async function EditProposalTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["owner", "admin", "manager", "sales"]);
  const { id } = await params;
  const tpl = await getProposalTemplate(id);
  if (!tpl) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/proposals/templates">
            <ArrowLeft className="mr-1 size-4" /> Templates
          </Link>
        </Button>
      </div>
      <PageHeader title={`Éditer : ${tpl.name}`} />
      <TemplateForm
        initial={{
          id: tpl.id,
          slug: tpl.slug,
          name: tpl.name,
          description: tpl.description ?? "",
          sections: tpl.sections,
          defaultSetup: Number(tpl.defaultSetup),
          defaultRecurring: Number(tpl.defaultRecurring),
        }}
      />
    </div>
  );
}
