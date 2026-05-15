import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
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
import { getCampaigns, getEmailMessages } from "@/lib/email/campaigns";
import { CampaignCreateDialog } from "./campaign-create-dialog";
import { SendButton } from "./send-button";

export const metadata = { title: "Communication" };

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  sent: "default",
  paused: "outline",
};

export default async function CampaignsPage() {
  await requireUser();
  const [campaigns, messages] = await Promise.all([getCampaigns(), getEmailMessages()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Communication"
        description="Campagnes email & journal des messages"
        action={<CampaignCreateDialog />}
      />

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
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
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Ouvert</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.toEmail}</TableCell>
                      <TableCell className="text-muted-foreground">{m.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.status}</Badge>
                      </TableCell>
                      <TableCell>{m.openedAt ? "✓" : "—"}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {format(m.createdAt, "d MMM HH:mm", { locale: fr })}
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
