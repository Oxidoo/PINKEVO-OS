import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUser } from "@/lib/auth/server";
import { getCampaigns, getEmailMessages, getEmailTemplates } from "@/lib/email/campaigns";
import { CampaignCreateDialog } from "./campaign-create-dialog";
import { MessagesTable } from "./messages-table";
import { SendButton } from "./send-button";
import { TemplateCreateDialog } from "./template-create-dialog";
import { TemplateDeleteButton } from "./template-delete-button";
import { TemplateEditDialog } from "./template-edit-dialog";

export const metadata = { title: "Communication" };

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  sent: "default",
  paused: "outline",
};

const CATEGORY_LABELS: Record<string, string> = {
  outreach: "Prospection",
  follow_up: "Suivi",
  proposal: "Proposition",
  invoice: "Facture",
  transactional: "Transactionnel",
};

export default async function CampaignsPage() {
  await requireUser();
  const [campaigns, messages, templates] = await Promise.all([
    getCampaigns(),
    getEmailMessages(),
    getEmailTemplates(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Communication"
        description="Campagnes email & journal des messages"
        action={<CampaignCreateDialog templates={templates} />}
      />

      <p className="text-sm text-muted-foreground">
        Les variables <code className="rounded bg-muted px-1 text-xs">{"{{prénom}}"}</code>,{" "}
        <code className="rounded bg-muted px-1 text-xs">{"{{société}}"}</code>, etc. sont
        remplacées automatiquement à l&apos;envoi.
      </p>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-6">
          {campaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
              Aucune campagne. Créez-en une pour démarrer une séquence email.
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Envoyés</TableHead>
                    <TableHead className="text-right">Ouvertures</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[c.status] ?? "secondary"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.sentCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.openCount}</TableCell>
                      <TableCell className="text-right">
                        <SendButton id={c.id} disabled={c.status === "sent"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
              Aucun email envoyé pour l&apos;instant.
            </div>
          ) : (
            <MessagesTable messages={messages} />
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {templates.length === 0
                ? "Aucun template. Créez-en un pour réutiliser vos emails."
                : `${templates.length} template${templates.length > 1 ? "s" : ""} disponible${templates.length > 1 ? "s" : ""}.`}
            </p>
            <TemplateCreateDialog />
          </div>

          {templates.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
              Aucun template. Créez-en un pour réutiliser vos emails.
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[t.category] ?? t.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.subject}</TableCell>
                      <TableCell className="text-right">
                        <TemplateDeleteButton id={t.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
