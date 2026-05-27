"use client";

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
import type { StripePaymentLinkOption } from "@/lib/integrations/stripe/client";
import { createProposalFromTemplate } from "@/lib/proposals/actions";

interface TemplateOpt {
  id: string;
  name: string;
  slug: string;
  variables: string[];
  defaultSetup: number;
  defaultRecurring: number;
}

interface Props {
  templates: TemplateOpt[];
  clients: { id: string; name: string }[];
  leads: { id: string; name: string }[];
  paymentLinks: StripePaymentLinkOption[];
  stripeReady: boolean;
}

const NONE = "__none__";
// Variables remplies automatiquement par le serveur, à ne pas demander à l'utilisateur.
const AUTO_VARS = new Set(["client", "prenom", "societe", "date", "prix_setup", "prix_mensuel"]);

export function ProposalForm({ templates, clients, leads, paymentLinks, stripeReady }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [clientId, setClientId] = useState(NONE);
  const [leadId, setLeadId] = useState(NONE);
  const [paymentLinkId, setPaymentLinkId] = useState(NONE);

  const tpl = useMemo(() => templates.find((t) => t.id === templateId), [templates, templateId]);
  const [setup, setSetup] = useState(tpl?.defaultSetup ?? 0);
  const [recurring, setRecurring] = useState(tpl?.defaultRecurring ?? 0);
  const customVars = useMemo(
    () => (tpl?.variables ?? []).filter((v) => !AUTO_VARS.has(v)),
    [tpl?.variables],
  );
  const [vars, setVars] = useState<Record<string, string>>({});

  function pickTemplate(id: string) {
    setTemplateId(id);
    const next = templates.find((t) => t.id === id);
    if (next) {
      setSetup(next.defaultSetup);
      setRecurring(next.defaultRecurring);
    }
    setVars({});
  }

  function onSubmit() {
    if (!templateId) {
      toast.error("Sélectionnez un template");
      return;
    }
    const link = paymentLinks.find((p) => p.id === paymentLinkId);
    start(async () => {
      const r = await createProposalFromTemplate({
        templateId,
        clientId: clientId === NONE ? "" : clientId,
        leadId: leadId === NONE ? "" : leadId,
        totalSetup: setup,
        totalRecurring: recurring,
        paymentLinkUrl: link?.url ?? "",
        paymentLinkLabel: link?.label ?? "",
        variables: vars,
      });
      if (r.ok) {
        toast.success("Devis créé");
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
        <p className="text-xs text-muted-foreground">
          Le nom / société du destinataire alimente automatiquement les variables{" "}
          <code>{"{{client}}"}</code> <code>{"{{prenom}}"}</code> <code>{"{{societe}}"}</code>.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Tarifs</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="setup">Setup (€)</Label>
            <Input
              id="setup"
              type="number"
              min={0}
              step="0.01"
              value={setup}
              onChange={(e) => setSetup(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recurring">Récurrent / mois (€)</Label>
            <Input
              id="recurring"
              type="number"
              min={0}
              step="0.01"
              value={recurring}
              onChange={(e) => setRecurring(Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Lien Stripe (optionnel)</h2>
        {!stripeReady ? (
          <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            Stripe non configuré. Ajoute <code>STRIPE_SECRET_KEY</code> dans Vercel pour proposer
            un lien de paiement dans le devis.
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
              Créer un Payment Link
            </a>
            .
          </p>
        ) : (
          <Select value={paymentLinkId} onValueChange={setPaymentLinkId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>— Aucun lien de paiement —</SelectItem>
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
      </section>

      {customVars.length > 0 && (
        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">Variables personnalisées</h2>
          <p className="text-xs text-muted-foreground">
            Le template utilise ces variables que tu dois remplir.
          </p>
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
          {pending ? "Création…" : "Créer le devis"}
        </Button>
      </div>
    </form>
  );
}
