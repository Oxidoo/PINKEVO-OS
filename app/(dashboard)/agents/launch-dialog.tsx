"use client";

import { Play } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { SUPPORTED_MODELS, getModelOption } from "@/lib/ai/models";
import { triggerAgentRun } from "@/lib/ai/runs";

export interface LaunchContext {
  clients?: { id: string; name: string }[];
  leads?: { id: string; name: string }[];
  websites?: { id: string; name: string }[];
}

type FieldOption = { value: string; label: string };

type Field =
  | { kind: "text" | "number" | "textarea"; name: string; label: string; placeholder?: string }
  | { kind: "select"; name: string; label: string; options: FieldOption[]; optional?: boolean };

const NONE_VALUE = "__none__";
const DEFAULT_MODEL_VALUE = "__default__";

function leadLabel(l: { id: string; name: string }): FieldOption {
  return { value: l.id, label: l.name };
}

function fieldsFor(slug: string, ctx: LaunchContext): Field[] {
  switch (slug) {
    case "lead_prospector":
      return [
        { kind: "text", name: "keyword", label: "Mot-clé métier", placeholder: "restaurant" },
        { kind: "text", name: "city", label: "Ville", placeholder: "Paris" },
        { kind: "number", name: "count", label: "Nombre cible" },
      ];
    case "lead_qualifier":
      return [
        {
          kind: "select",
          name: "leadId",
          label: "Lead",
          options: (ctx.leads ?? []).map(leadLabel),
        },
      ];
    case "proposal_writer":
      return [
        {
          kind: "select",
          name: "service",
          label: "Service",
          options: [
            { value: "audit_seo", label: "Audit SEO" },
            { value: "refonte_site", label: "Refonte site" },
            { value: "seo_recurrent", label: "SEO récurrent" },
            { value: "pack_agence", label: "Pack agence" },
          ],
        },
        {
          kind: "select",
          name: "clientId",
          label: "Client (optionnel)",
          options: (ctx.clients ?? []).map(leadLabel),
          optional: true,
        },
        {
          kind: "select",
          name: "leadId",
          label: "Lead (optionnel)",
          options: (ctx.leads ?? []).map(leadLabel),
          optional: true,
        },
        { kind: "textarea", name: "objectives", label: "Objectifs" },
      ];
    case "seo_auditor":
    case "perf_auditor":
      return [
        {
          kind: "select",
          name: "websiteId",
          label: "Site",
          options: (ctx.websites ?? []).map(leadLabel),
        },
      ];
    default:
      return [];
  }
}

export function LaunchDialog({
  slug,
  disabled,
  defaultModel,
  context = {},
}: {
  slug: string;
  disabled?: boolean;
  defaultModel: string;
  context?: LaunchContext;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [modelChoice, setModelChoice] = useState<string>(DEFAULT_MODEL_VALUE);
  const fields = fieldsFor(slug, context);
  const defaultLabel = getModelOption(defaultModel)?.label ?? defaultModel;

  function onSubmit(formData: FormData) {
    // Drop empty strings AND the "none" sentinel from optional pickers.
    const input = Object.fromEntries(
      Array.from(formData.entries()).filter(([, v]) => v !== "" && v !== NONE_VALUE),
    );
    start(async () => {
      const res = await triggerAgentRun(
        slug,
        input,
        modelChoice !== DEFAULT_MODEL_VALUE ? { modelOverride: modelChoice } : undefined,
      );
      if (res.ok) {
        toast.success("Agent lancé — résultat en cours…");
        setOpen(false);
        setModelChoice(DEFAULT_MODEL_VALUE);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Play className="mr-1 size-4" /> Lancer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lancer l&apos;agent</DialogTitle>
          <DialogDescription>
            L&apos;exécution est tracée (tokens, coût, durée) dans l&apos;historique.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.kind === "textarea" ? (
                <Textarea id={f.name} name={f.name} rows={3} required />
              ) : f.kind === "select" ? (
                <Select
                  name={f.name}
                  defaultValue={f.optional ? NONE_VALUE : f.options[0]?.value}
                  required={!f.optional}
                >
                  <SelectTrigger id={f.name}>
                    <SelectValue
                      placeholder={
                        f.options.length === 0 ? "Aucune entrée disponible" : "Sélectionner…"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {f.optional && (
                      <SelectItem value={NONE_VALUE}>— Aucun —</SelectItem>
                    )}
                    {f.options.length === 0 && !f.optional ? (
                      <SelectItem value="__empty__" disabled>
                        Aucune entrée — créez-en d&apos;abord
                      </SelectItem>
                    ) : (
                      f.options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={f.name}
                  name={f.name}
                  type={f.kind === "number" ? "number" : "text"}
                  placeholder={f.placeholder}
                  required
                />
              )}
            </div>
          ))}

          <div className="space-y-1.5 border-t pt-4">
            <Label htmlFor="modelChoice">Modèle LLM pour ce run</Label>
            <Select value={modelChoice} onValueChange={setModelChoice}>
              <SelectTrigger id="modelChoice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_MODEL_VALUE}>
                  <div className="flex flex-col">
                    <span className="font-medium">Par défaut</span>
                    <span className="text-xs text-muted-foreground">{defaultLabel}</span>
                  </div>
                </SelectItem>
                {SUPPORTED_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{m.label}</span>
                      <span className="text-xs text-muted-foreground">{m.tagline}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Exécution…" : "Exécuter l'agent"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
