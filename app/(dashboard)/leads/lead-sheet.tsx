"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  Calendar,
  CalendarClock,
  Check,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  PhoneCall,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getLeadContacts, updateLeadContactNote } from "@/lib/crm/leads";
import type { Lead, LeadContact } from "@/lib/db/schema";
import { LeadContactDialog } from "./lead-contact-dialog";

function toDateTimeLocal(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const tz = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(tz).toISOString().slice(0, 16);
}

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

function ContactEntry({
  entry,
  onUpdated,
}: {
  entry: LeadContact;
  onUpdated: (patch: { note: string | null; followupAt: Date | null }) => void;
}) {
  const Icon = METHOD_ICON[entry.method] ?? Phone;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.note ?? "");
  const [followup, setFollowup] = useState(toDateTimeLocal(entry.followupAt));
  const [pending, start] = useTransition();

  function handleEdit() {
    setDraft(entry.note ?? "");
    setFollowup(toDateTimeLocal(entry.followupAt));
    setEditing(true);
  }

  function handleSave() {
    start(async () => {
      const r = await updateLeadContactNote(entry.id, draft, followup || null);
      if (r.ok) {
        onUpdated({
          note: draft.trim() || null,
          followupAt: followup ? new Date(followup) : null,
        });
        setEditing(false);
        toast.success("Note mise à jour");
      } else {
        toast.error(r.error);
      }
    });
  }

  function handleCancel() {
    setDraft(entry.note ?? "");
    setFollowup(toDateTimeLocal(entry.followupAt));
    setEditing(false);
  }

  const followupDate = entry.followupAt ? new Date(entry.followupAt) : null;
  const followupFuture = followupDate && followupDate.getTime() > Date.now();

  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Icon className="size-3.5 text-muted-foreground" />
          {METHOD_LABEL[entry.method] ?? entry.method}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {format(new Date(entry.contactedAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
          </span>
          {!editing && (
            <button
              type="button"
              onClick={handleEdit}
              className="ml-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
              title="Modifier"
            >
              <Pencil className="size-3" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={1000}
            autoFocus
            className="text-sm"
          />
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CalendarClock className="size-3" />
              Rappel (optionnel)
            </label>
            <Input
              type="datetime-local"
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={pending}>
              <Check className="mr-1 size-3" />
              {pending ? "Enregistrement…" : "Sauvegarder"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={pending}>
              <X className="mr-1 size-3" />
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <>
          {entry.note && <p className="mt-1 text-muted-foreground">{entry.note}</p>}
          {followupDate && (
            <p
              className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
                followupFuture ? "text-amber-600" : "text-muted-foreground line-through"
              }`}
            >
              <CalendarClock className="size-3" />
              Rappel le {format(followupDate, "d MMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          )}
        </>
      )}
    </div>
  );
}

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

  const nextFollowup = useMemo(() => {
    const now = Date.now();
    let best: LeadContact | null = null;
    for (const h of history) {
      if (!h.followupAt) continue;
      const t = new Date(h.followupAt).getTime();
      if (t < now) continue;
      if (!best || t < new Date(best.followupAt!).getTime()) best = h;
    }
    return best;
  }, [history]);

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
        <SheetContent className="w-full overflow-y-auto px-6 py-6 sm:max-w-xl sm:px-8">
          <SheetHeader className="space-y-2 p-0">
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
              {nextFollowup?.followupAt && (
                <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-600">
                  <CalendarClock className="size-3" />
                  Rappel{" "}
                  {format(new Date(nextFollowup.followupAt), "d MMM 'à' HH:mm", { locale: fr })}
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
                    {history.map((entry) => (
                      <ContactEntry
                        key={entry.id}
                        entry={entry}
                        onUpdated={(patch) =>
                          setHistory((prev) =>
                            prev.map((e) =>
                              e.id === entry.id
                                ? { ...e, note: patch.note, followupAt: patch.followupAt }
                                : e,
                            ),
                          )
                        }
                      />
                    ))}
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
