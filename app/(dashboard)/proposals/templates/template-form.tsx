"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProposalTemplate, updateProposalTemplate } from "@/lib/proposals/templates";

interface Initial {
  id?: string;
  slug: string;
  name: string;
  description: string;
  sections: {
    title: string;
    context: string;
    objectives: string[];
    deliverables: string[];
    timeline: string;
    conditions: string;
  };
  defaultSetup: number;
  defaultRecurring: number;
}

const SUGGESTED_VARIABLES = [
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
  const [context, setContext] = useState(initial?.sections.context ?? "");
  const [objectives, setObjectives] = useState<string[]>(
    initial?.sections.objectives ?? [""],
  );
  const [deliverables, setDeliverables] = useState<string[]>(
    initial?.sections.deliverables ?? [""],
  );
  const [timeline, setTimeline] = useState(initial?.sections.timeline ?? "");
  const [conditions, setConditions] = useState(initial?.sections.conditions ?? "");
  const [defaultSetup, setDefaultSetup] = useState(initial?.defaultSetup ?? 0);
  const [defaultRecurring, setDefaultRecurring] = useState(initial?.defaultRecurring ?? 0);

  function updateAt(arr: string[], setter: (a: string[]) => void, i: number, v: string) {
    setter(arr.map((x, idx) => (idx === i ? v : x)));
  }
  function removeAt(arr: string[], setter: (a: string[]) => void, i: number) {
    setter(arr.filter((_, idx) => idx !== i));
  }

  function onSubmit() {
    const cleanObjectives = objectives.map((s) => s.trim()).filter(Boolean);
    const cleanDeliverables = deliverables.map((s) => s.trim()).filter(Boolean);
    if (cleanObjectives.length === 0 || cleanDeliverables.length === 0) {
      toast.error("Au moins 1 objectif et 1 livrable requis");
      return;
    }
    const payload = {
      slug,
      name,
      description,
      sections: {
        title,
        context,
        objectives: cleanObjectives,
        deliverables: cleanDeliverables,
        timeline,
        conditions,
      },
      defaultSetup,
      defaultRecurring,
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

  function insertVariable(v: string, into: (val: string) => void, current: string) {
    into(`${current}${v}`);
  }

  return (
    <form
      action={onSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_280px]"
    >
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
                placeholder="Pack agence — défaut"
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
                placeholder="pack-agence-default"
                required
                pattern="[a-z0-9-]+"
                maxLength={96}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (interne)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">Sections du devis</h2>
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre du devis</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pack agence pour {{client}}"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="context">Contexte</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Objectifs</Label>
            {objectives.map((o, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={o}
                  onChange={(e) => updateAt(objectives, setObjectives, i, e.target.value)}
                  placeholder="Refonte du site web"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAt(objectives, setObjectives, i)}
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
              onClick={() => setObjectives([...objectives, ""])}
            >
              <Plus className="mr-1 size-3" /> Ajouter un objectif
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Livrables</Label>
            {deliverables.map((d, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={d}
                  onChange={(e) => updateAt(deliverables, setDeliverables, i, e.target.value)}
                  placeholder="Audit initial"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAt(deliverables, setDeliverables, i)}
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
              onClick={() => setDeliverables([...deliverables, ""])}
            >
              <Plus className="mr-1 size-3" /> Ajouter un livrable
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timeline">Planning</Label>
            <Textarea
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              rows={2}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conditions">Conditions</Label>
            <Textarea
              id="conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={3}
              placeholder="Devis valable 30 jours. Règlement 30 jours fin de mois. Acompte 30% à la signature."
              required
            />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">Tarifs par défaut</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="setup">Setup (€)</Label>
              <Input
                id="setup"
                type="number"
                min={0}
                step="0.01"
                value={defaultSetup}
                onChange={(e) => setDefaultSetup(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recurring">Récurrent / mois (€)</Label>
              <Input
                id="recurring"
                type="number"
                min={0}
                step="0.01"
                value={defaultRecurring}
                onChange={(e) => setDefaultRecurring(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Ces valeurs sont pré-remplies à la création d&apos;un devis, modifiables au cas par cas.
          </p>
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
            Cliquez pour insérer dans le contexte. Substituées à la création du devis.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTED_VARIABLES.map((v) => (
              <Badge
                key={v}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => insertVariable(v, setContext, context)}
              >
                {v}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tu peux mettre tes propres variables au format <code>{"{{ma_variable}}"}</code> —
            elles seront proposées au remplissage.
          </p>
        </div>
      </aside>
    </form>
  );
}
