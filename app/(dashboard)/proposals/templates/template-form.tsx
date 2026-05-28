"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { createProposalTemplate, updateProposalTemplate } from "@/lib/proposals/templates";

interface LineItem {
  label: string;
  frequency: string;
  unitPrice: number;
  group: "setup" | "recurring";
}

interface DeliverableGroup {
  service: string;
  items: string[];
  frequency: string;
}

interface AdditionalSection {
  title: string;
  body: string;
}

interface Initial {
  id?: string;
  slug: string;
  name: string;
  description: string;
  sections: {
    title: string;
    subtitle?: string;
    objectDescription: string;
    lineItems: LineItem[];
    deliverables: DeliverableGroup[];
    conditionsEngagement: string;
    conditionsBilling: string;
    conditionsPriceRevision: string;
    conditionsClientObligations: string;
    additionalSections?: AdditionalSection[];
  };
}

const SUGGESTED_VARS = [
  "{{client}}",
  "{{prenom}}",
  "{{societe}}",
  "{{date}}",
  "{{prix_setup}}",
  "{{prix_mensuel}}",
];

export function TemplateForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const [title, setTitle] = useState(initial?.sections.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.sections.subtitle ?? "");
  const [objectDescription, setObjectDescription] = useState(
    initial?.sections.objectDescription ?? "",
  );
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initial?.sections.lineItems ?? [{ label: "", frequency: "1x", unitPrice: 0, group: "setup" }],
  );
  const [deliverables, setDeliverables] = useState<DeliverableGroup[]>(
    initial?.sections.deliverables ?? [{ service: "", items: [""], frequency: "" }],
  );
  const [conditionsEngagement, setConditionsEngagement] = useState(
    initial?.sections.conditionsEngagement ?? "",
  );
  const [conditionsBilling, setConditionsBilling] = useState(
    initial?.sections.conditionsBilling ?? "",
  );
  const [conditionsPriceRevision, setConditionsPriceRevision] = useState(
    initial?.sections.conditionsPriceRevision ?? "",
  );
  const [conditionsClientObligations, setConditionsClientObligations] = useState(
    initial?.sections.conditionsClientObligations ?? "",
  );
  const [additionalSections, setAdditionalSections] = useState<AdditionalSection[]>(
    initial?.sections.additionalSections ?? [],
  );

  function updateLineItem(i: number, patch: Partial<LineItem>) {
    setLineItems(lineItems.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function removeLineItem(i: number) {
    setLineItems(lineItems.filter((_, idx) => idx !== i));
  }
  function addLineItem(group: "setup" | "recurring") {
    setLineItems([
      ...lineItems,
      { label: "", frequency: group === "setup" ? "1x" : "/mois", unitPrice: 0, group },
    ]);
  }

  function updateDeliverable(i: number, patch: Partial<DeliverableGroup>) {
    setDeliverables(deliverables.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function removeDeliverable(i: number) {
    setDeliverables(deliverables.filter((_, idx) => idx !== i));
  }
  function addDeliverableItem(i: number) {
    updateDeliverable(i, { items: [...(deliverables[i]?.items ?? []), ""] });
  }
  function removeDeliverableItem(i: number, j: number) {
    updateDeliverable(i, { items: (deliverables[i]?.items ?? []).filter((_, idx) => idx !== j) });
  }
  function updateDeliverableItem(i: number, j: number, v: string) {
    const items = (deliverables[i]?.items ?? []).map((x, idx) => (idx === j ? v : x));
    updateDeliverable(i, { items });
  }

  function onSubmit() {
    const cleanItems = lineItems.filter((it) => it.label.trim());
    const cleanDeliverables = deliverables
      .filter((d) => d.service.trim())
      .map((d) => ({
        ...d,
        items: d.items.map((s) => s.trim()).filter(Boolean),
      }))
      .filter((d) => d.items.length > 0);
    if (cleanItems.length === 0) {
      toast.error("Au moins 1 ligne tarifaire requise");
      return;
    }
    if (cleanDeliverables.length === 0) {
      toast.error("Au moins 1 groupe de livrables requis");
      return;
    }
    const payload = {
      slug,
      name,
      description,
      sections: {
        title,
        subtitle,
        objectDescription,
        lineItems: cleanItems,
        deliverables: cleanDeliverables,
        conditionsEngagement,
        conditionsBilling,
        conditionsPriceRevision,
        conditionsClientObligations,
        additionalSections: additionalSections.filter((s) => s.title.trim() && s.body.trim()),
      },
    };
    start(async () => {
      const r = initial?.id
        ? await updateProposalTemplate(initial.id, payload)
        : await createProposalTemplate(payload);
      if (r.ok) {
        toast.success(initial?.id ? "Template mis à jour" : "Template créé");
        router.push("/proposals/templates");
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">Identifiant</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={160}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                pattern="[a-z0-9-]+"
                maxLength={96}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description interne</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">Titres</h2>
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre du devis *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Devis de prestation pour {{client}}"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subtitle">Sous-titre</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Référencement Web · Avis Clients"
            />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">1. Objet du devis</h2>
          <Textarea
            value={objectDescription}
            onChange={(e) => setObjectDescription(e.target.value)}
            rows={4}
            required
            placeholder="Le présent devis a pour objet…"
          />
        </section>

        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">2. Lignes tarifaires</h2>
          <p className="text-xs text-muted-foreground">
            Le PDF additionne automatiquement par groupe.
          </p>
          {(["setup", "recurring"] as const).map((group) => (
            <div key={group} className="space-y-2 rounded-md bg-muted/30 p-3">
              <p className="text-xs font-semibold text-brand-700">
                {group === "setup" ? "FRAIS DE MISE EN SERVICE" : "ABONNEMENT MENSUEL RÉCURRENT"}
              </p>
              {lineItems
                .map((it, i) => ({ it, i }))
                .filter(({ it }) => it.group === group)
                .map(({ it, i }) => (
                  <div key={i} className="grid grid-cols-[2fr_70px_80px_auto] gap-2">
                    <Input
                      value={it.label}
                      onChange={(e) => updateLineItem(i, { label: e.target.value })}
                      placeholder="Désignation"
                    />
                    <Input
                      value={it.frequency}
                      onChange={(e) => updateLineItem(i, { frequency: e.target.value })}
                      placeholder={group === "setup" ? "1x" : "/mois"}
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) =>
                        updateLineItem(i, { unitPrice: Number(e.target.value) })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(i)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addLineItem(group)}
              >
                <Plus className="mr-1 size-3" /> Ajouter une ligne
              </Button>
            </div>
          ))}
        </section>

        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">3. Livrables (groupés par service)</h2>
          {deliverables.map((d, i) => (
            <div key={i} className="space-y-2 rounded-md bg-muted/30 p-3">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  value={d.service}
                  onChange={(e) => updateDeliverable(i, { service: e.target.value })}
                  placeholder="SEO"
                />
                <Input
                  value={d.frequency}
                  onChange={(e) => updateDeliverable(i, { frequency: e.target.value })}
                  placeholder="Mensuel"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDeliverable(i)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {d.items.map((it, j) => (
                  <div key={j} className="flex gap-2">
                    <Input
                      value={it}
                      onChange={(e) => updateDeliverableItem(i, j, e.target.value)}
                      placeholder="• Rapport mensuel"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeliverableItem(i, j)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addDeliverableItem(i)}
                >
                  <Plus className="mr-1 size-3" /> Ajouter un livrable
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setDeliverables([...deliverables, { service: "", items: [""], frequency: "" }])
            }
          >
            <Plus className="mr-1 size-3" /> Ajouter un groupe de service
          </Button>
        </section>

        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">4. Conditions de l&apos;abonnement</h2>
          <div className="space-y-1.5">
            <Label>4.1 Durée d&apos;engagement</Label>
            <Textarea
              value={conditionsEngagement}
              onChange={(e) => setConditionsEngagement(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>4.2 Facturation & paiement</Label>
            <Textarea
              value={conditionsBilling}
              onChange={(e) => setConditionsBilling(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>4.3 Révision tarifaire</Label>
            <Textarea
              value={conditionsPriceRevision}
              onChange={(e) => setConditionsPriceRevision(e.target.value)}
              rows={2}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>4.4 Obligations du client</Label>
            <Textarea
              value={conditionsClientObligations}
              onChange={(e) => setConditionsClientObligations(e.target.value)}
              rows={3}
              required
            />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">Sections additionnelles</h2>
          <p className="text-xs text-muted-foreground">
            Ex: « Conformité légale du système d&apos;avis », « Propriété intellectuelle »…
          </p>
          {additionalSections.map((s, i) => (
            <div key={i} className="space-y-2 rounded-md bg-muted/30 p-3">
              <div className="flex gap-2">
                <Input
                  value={s.title}
                  onChange={(e) => {
                    const next = [...additionalSections];
                    if (next[i]) next[i] = { ...next[i], title: e.target.value };
                    setAdditionalSections(next);
                  }}
                  placeholder="Titre de la section"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setAdditionalSections(additionalSections.filter((_, idx) => idx !== i))
                  }
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Textarea
                value={s.body}
                onChange={(e) => {
                  const next = [...additionalSections];
                  if (next[i]) next[i] = { ...next[i], body: e.target.value };
                  setAdditionalSections(next);
                }}
                rows={3}
                placeholder="Contenu…"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdditionalSections([...additionalSections, { title: "", body: "" }])}
          >
            <Plus className="mr-1 size-3" /> Ajouter une section
          </Button>
        </section>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/proposals/templates")}
            disabled={pending}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : initial?.id ? "Mettre à jour" : "Créer le template"}
          </Button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="sticky top-4 rounded-xl border p-4 text-sm">
          <p className="font-semibold">Variables disponibles</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Substituées à la création du devis.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTED_VARS.map((v) => (
              <Badge key={v} variant="outline">
                {v}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tu peux mettre tes propres variables au format <code>{"{{ma_variable}}"}</code> dans
            n&apos;importe quel champ — elles seront proposées au remplissage.
          </p>
        </div>
      </aside>
    </form>
  );
}
