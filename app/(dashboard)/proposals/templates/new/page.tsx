import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { TemplateForm } from "../template-form";

export const metadata = { title: "Nouveau template" };

export default async function NewProposalTemplatePage() {
  await requireRole(["owner", "admin", "manager", "sales"]);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/proposals/templates">
            <ArrowLeft className="mr-1 size-4" /> Templates
          </Link>
        </Button>
      </div>
      <PageHeader title="Nouveau template de devis" />
      <TemplateForm />
    </div>
  );
}
