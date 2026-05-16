import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/server";
import { getDocuments } from "@/lib/documents/actions";
import { DocumentsClient } from "./documents-client";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  await requireUser();
  const docs = await getDocuments();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documents"
        description="Drive interne — contrats, briefs, assets, rapports (URLs signées)"
      />
      <DocumentsClient
        documents={docs.map((d) => ({
          id: d.id,
          name: d.name,
          mimeType: d.mimeType,
          sizeBytes: d.sizeBytes,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
