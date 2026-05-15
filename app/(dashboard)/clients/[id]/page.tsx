import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUser } from "@/lib/auth/server";
import { getClientDetail } from "@/lib/crm/clients";
import { formatCurrency } from "@/lib/format";
import { ActivityComposer } from "./activity-composer";
import { ContactDialog } from "./contact-dialog";

const STATUS_LABEL: Record<string, string> = {
  prospect: "Prospect",
  active: "Actif",
  churned: "Churned",
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const data = await getClientDetail(id);
  if (!data) notFound();
  const { client, contacts, deals, activities } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/clients">
            <ArrowLeft className="mr-1 size-4" /> Clients
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              {client.company ?? "—"} · {client.industry ?? "secteur n/a"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge>{STATUS_LABEL[client.status]}</Badge>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">MRR</p>
              <p className="text-lg font-semibold tabular-nums">{formatCurrency(client.mrr)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">LTV</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(client.lifetimeValue)}
              </p>
            </div>
          </div>
        </div>
        {client.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {client.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activité ({activities.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="deals">Deals ({deals.length})</TabsTrigger>
          <TabsTrigger value="info">Infos</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6 space-y-4">
          <ActivityComposer clientId={client.id} />
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité.</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="flex gap-3 rounded-lg border p-3">
                  <Badge variant="secondary" className="h-fit shrink-0 capitalize">
                    {a.type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    {a.subject && <p className="font-medium">{a.subject}</p>}
                    {a.content && <p className="text-sm text-muted-foreground">{a.content}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(a.performedAt, "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <ContactDialog clientId={client.id} />
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun contact.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {contacts.map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {c.firstName} {c.lastName}
                      {c.isPrimary && (
                        <Badge variant="outline" className="text-xs">
                          Principal
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{c.position ?? "—"}</p>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {c.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="size-3.5 text-muted-foreground" /> {c.email}
                      </p>
                    )}
                    {c.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="size-3.5 text-muted-foreground" /> {c.phone}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun deal.</p>
          ) : (
            <div className="space-y-2">
              {deals.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{d.stage}</p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatCurrency(d.value)}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="info" className="mt-6">
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acquis le</span>
                <span>
                  {client.acquiredAt
                    ? format(client.acquiredAt, "d MMM yyyy", { locale: fr })
                    : "—"}
                </span>
              </div>
              <Separator />
              <div>
                <p className="mb-1 text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap">{client.notes ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
