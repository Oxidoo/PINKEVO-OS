"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  Calendar,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getLeadContacts } from "@/lib/crm/leads";
import type { Lead, LeadContact } from "@/lib/db/schema";
import { LeadContactDialog } from "./lead-contact-dialog";

function leadName(lead: Lead) {
  const n = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
  return n || lead.company || lead.email || "Lead sans nom";
}

const METHOD_ICON: Record<string, React.ElementType> = {
  call: PhoneCall,
  email: Mail,
  sms: MessageSquare,
};

const METHOD_LABEL: Record<string, string> = {
  call: "Appel",
  email: "Email",
  sms: "SMS",
};

export function LeadSheet({
  lead,
  open,
  onClose,
  onContacted,
}: {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onContacted: () => void;
}) {
  const [contactOpen, setContactOpen] = useState(false);
  const [history, setHistory] = useState<LeadContact[]>([]);

  useEffect(() => {
    if (lead) {
      getLeadContacts(lead.id).then(setHistory).catch(() => setHistory([]));
    } else {
      setHistory([]);
    }
  }, [lead]);

  function handleDone() {
    if (lead) {
      getLeadContacts(lead.id).then(setHistory).catch(() => {});
    }
    onContacted();
  }

  if (!lead) return null;

  const pappers = lead.enrichmentData?.pappers as Record<string, unknown> | undefined;
  const website = lead.enrichmentData?.website as string | undefined;
  const name = leadName(lead);

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="space-y-2">
            <SheetTitle className="text-lg">{name}</SheetTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {lead.status}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {lead.source}
              </Badge>
              {lead.score > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Star className="size-3" />
                  {lead.score}/100
                </Badge>
              )}
            </div>
          </SheetHeader>

          <div className="mt-4">
            <Button
              className="w-full"
              onClick={() => setContactOpen(true)}
            >
              <PhoneCall className="mr-2 size-4" />
              Contacté
            </Button>
          </div>

          <div className="mt-6 space-y-5">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contact
              </h3>
              {lead.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <span>{lead.company}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}
              {website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="size-4 shrink-0 text-muted-foreground" />
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-primary hover:underline"
                  >
                    {website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {lead.zone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0" />
                  {lead.zone}
                </div>
              )}
              {lead.lastContactedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4 shrink-0" />
                  Dernier contact :{" "}
                  {format(new Date(lead.lastContactedAt), "d MMM yyyy", { locale: fr })}
                </div>
              )}
              {!lead.company && !lead.email && !lead.phone && (
                <p className="text-sm text-muted-foreground">Aucune information de contact</p>
              )}
            </section>

            {(lead.category || lead.sector || lead.zone) && (
              <>
                <Separator />
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Classification
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lead.category && <Badge variant="secondary">{lead.category}</Badge>}
                    {lead.sector && <Badge variant="outline">{lead.sector}</Badge>}
                    {lead.zone && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="size-3" />
                        {lead.zone}
                      </Badge>
                    )}
                  </div>
                </section>
              </>
            )}

            {history.length > 0 && (
              <>
                <Separator />
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Historique des contacts
                  </h3>
                  <div className="space-y-2">
                    {history.map((entry) => {
                      const Icon = METHOD_ICON[entry.method] ?? Phone;
                      return (
                        <div
                          key={entry.id}
                          className="rounded-lg border bg-muted/20 px-3 py-2.5 text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-medium">
                              <Icon className="size-3.5 text-muted-foreground" />
                              {METHOD_LABEL[entry.method] ?? entry.method}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.contactedAt), "d MMM yyyy 'à' HH:mm", {
                                locale: fr,
                              })}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="mt-1 text-muted-foreground">{entry.note}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {pappers && (
              <>
                <Separator />
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Données Pappers
                  </h3>
                  <dl className="space-y-1.5 text-sm">
                    {[
                      ["SIREN", pappers.siren],
                      ["Forme juridique", pappers.forme_juridique],
                      ["Code NAF", pappers.code_naf],
                      ["Activité", pappers.libelle_code_naf],
                      ["Effectif", pappers.effectif],
                      ["Chiffre d'affaires", pappers.chiffre_affaires],
                    ]
                      .filter(([, v]) => v)
                      .map(([label, value]) => (
                        <div key={String(label)} className="flex justify-between gap-4">
                          <dt className="shrink-0 text-muted-foreground">{String(label)}</dt>
                          <dd className="text-right font-medium">{String(value)}</dd>
                        </div>
                      ))}
                    {pappers.capital_social != null && (
                      <div className="flex justify-between gap-4">
                        <dt className="shrink-0 text-muted-foreground">Capital social</dt>
                        <dd className="text-right font-medium">
                          {Number(pappers.capital_social).toLocaleString("fr-FR")} €
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {contactOpen && (
        <LeadContactDialog
          leadId={lead.id}
          leadName={name}
          open={contactOpen}
          onClose={() => setContactOpen(false)}
          onDone={handleDone}
        />
      )}
    </>
  );
}
