"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import type { StripePaymentLinkOption } from "@/lib/integrations/stripe/client";
import { createProposalFromTemplate } from "@/lib/proposals/actions";

interface LineItem {
  label: string;
  frequency: string;
  unitPrice: number;
  group: "setup" | "recurring";
}

interface TemplateOpt {
  id: string;
  name: string;
  slug: string;
  variables: string[];
  lineItems: LineItem[];
}

interface Props {
  templates: TemplateOpt[];
  clients: { id: string; name: string }[];
  leads: { id: string; name: string }[];
  paymentLinks: StripePaymentLinkOption[];
  stripeReady: boolean;
}

const NONE = "__none__";
const AUTO_VARS = new Set(["client", "prenom", "societe", "date", "prix_setup", "prix_mensuel"]);

export function ProposalForm({ templates, clients, leads, paymentLinks, stripeReady }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [clientId, setClientId] = useState(NONE);
  const [leadId, setLeadId] = useState(NONE);
  const [paymentLinkId, setPaymentLinkId] = useState(NONE);

  const tpl = useMemo(() => templates.find((t) => t.id === templateId), [templates, templateId]);
  const [lineItems, setLineItems] = useState<LineItem[]>(tpl?.lineItems ?? []);

  const customVars = useMemo(
    () => (tpl?.variables ?? []).filter((v) => !AUTO_VARS.has(v)),
    [tpl?.variables],
  );
  const [vars, setVars] = useState<Record<string, string>>({});

  const totalSetup = lineItems
    .filter((i) => i.group === "setup")
    .reduce((s, i) => s + Number(i.unitPrice || 0), 0);
  const totalRecurring = lineItems
    .filter((i) => i.group === "recurring")
    .reduce((s, i) => s + Number(i.unitPrice || 0), 0);

  function pickTemplate(id: string) {
    setTemplateId(id);
    const next = templates.find((t) => t.id === id);
    setLineItems(next?.lineItems ?? []);
    setVars({});
  }

  function updateItem(i: number, patch: Partial<LineItem>) {
    setLineItems(lineItems.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function removeItem(i: number) {
    setLineItems(lineItems.filter((_, idx) => idx !== i));
  }
  function addItem(group: "setup" | "recurring") {
    setLineItems([
      ...lineItems,
      { label: "", frequency: group === "setup" ? "1x" : "/mois", unitPrice: 0, group },
    ]);
  }

  function onSubmit() {
    if (!templateId) {
      toast.error("Sélectionnez un template");
      return;
    }
    const cleanItems = lineItems.filter((i) => i.label.trim());
    if (cleanItems.length === 0) {
      toast.error("Au moins une ligne tarifaire requise");
      return;
    }
    const link = paymentLinks.find((p) => p.id === paymentLinkId);
    start(async () => {
      const r = await createProposalFromTemplate({
        templateId,
        clientId: clientId === NONE ? "" : clientId,
        leadId: leadId === NONE ? "" : leadId,
        lineItems: cleanItems,
        paymentLinkUrl: link?.url ?? "",
        paymentLinkLabel: link?.label ?? "",
        variables: vars,
      });
      if (r.ok) {
        toast.success("Devis créé en brouillon");
        router.push("/proposals");
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Template</h2>
        <Select value={templateId} onValueChange={pickTemplate}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez…" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Destinataire</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="client">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Aucun —</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead">Ou lead</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger id="lead">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Aucun —</SelectItem>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Lignes tarifaires</h2>
          <div className="text-xs text-muted-foreground">
            Setup : <span className="font-semibold tabular-nums">{formatCurrency(totalSetup)}</span>
            {" · "}Mensuel :{" "}
            <span className="font-semibold tabular-nums">{formatCurrency(totalRecurring)}</span>
          </div>
        </div>
        {(["setup", "recurring"] as const).map((group) => (
          <div key={group} className="space-y-2 rounded-md bg-muted/30 p-3">
            <p className="text-xs font-semibold text-brand-700">
              {group === "setup" ? "FRAIS DE MISE EN SERVICE" : "ABONNEMENT MENSUEL"}
            </p>
            {lineItems
              .map((it, i) => ({ it, i }))
              .filter(({ it }) => it.group === group)
              .map(({ it, i }) => (
                <div key={i} className="grid grid-cols-[2fr_70px_80px_auto] gap-2">
                  <Input
                    value={it.label}
                    onChange={(e) => updateItem(i, { label: e.target.value })}
                    placeholder="Désignation"
                  />
                  <Input
                    value={it.frequency}
                    onChange={(e) => updateItem(i, { frequency: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.unitPrice}
                    onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(i)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(group)}>
              <Plus className="mr-1 size-3" /> Ajouter une ligne
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Lien de paiement Stripe (optionnel)</h2>
        {!stripeReady ? (
          <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            Stripe non configuré. Ajoute <code>STRIPE_SECRET_KEY</code> dans Vercel.
          </p>
        ) : paymentLinks.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            Aucun Payment Link actif sur ton compte Stripe.{" "}
            <a
              href="https://dashboard.stripe.com/payment-links"
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 hover:underline"
            >
              En créer un
            </a>
            .
          </p>
        ) : (
          <Select value={paymentLinkId} onValueChange={setPaymentLinkId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>— Aucun —</SelectItem>
              {paymentLinks.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{p.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.amount != null
                        ? `${p.amount} ${p.currency}${p.interval === "month" ? " / mois" : p.interval === "year" ? " / an" : ""}`
                        : "Sans prix défini"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">
          Apparaît au client uniquement <strong>après signature</strong> du devis.
        </p>
      </section>

      {customVars.length > 0 && (
        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">Variables personnalisées</h2>
          {customVars.map((v) => (
            <div key={v} className="space-y-1.5">
              <Label htmlFor={`var-${v}`}>{`{{${v}}}`}</Label>
              <Input
                id={`var-${v}`}
                value={vars[v] ?? ""}
                onChange={(e) => setVars({ ...vars, [v]: e.target.value })}
              />
            </div>
          ))}
        </section>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/proposals")}
          disabled={pending}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer le brouillon"}
        </Button>
      </div>
    </form>
  );
}
