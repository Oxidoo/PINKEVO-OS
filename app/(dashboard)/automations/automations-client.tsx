"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Play, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Switch } from "@/components/ui/switch";
import {
  createAutomation,
  createFromTemplate,
  deleteAutomation,
  runAutomationNow,
  toggleAutomation,
} from "@/lib/automations/actions";

const STEP_OPTIONS = [
  { value: "qualify_lead", label: "Qualifier le lead (IA)" },
  { value: "audit_site", label: "Audit site (SEO + perf)" },
  { value: "send_followup", label: "Email de relance" },
  { value: "create_client_from_lead", label: "Convertir lead → client" },
  { value: "onboarding_email", label: "Email onboarding" },
] as const;

interface AutomationRow {
  id: string;
  name: string;
  triggerType: string;
  enabled: boolean;
  steps: { kind: string }[];
  lastRunAt: string | null;
}

interface Template {
  slug: string;
  name: string;
  description: string;
}

export function AutomationsClient({
  automations,
  templates,
}: {
  automations: AutomationRow[];
  templates: Template[];
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<{ id: string; kind: string }[]>([
    { id: crypto.randomUUID(), kind: "qualify_lead" },
  ]);

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(ok);
      else toast.error(r.error ?? "Erreur");
    });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Templates prêts à l&apos;emploi</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 size-4" /> Automatisation custom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle automatisation</DialogTitle>
              </DialogHeader>
              <form
                action={(fd) => {
                  start(async () => {
                    const r = await createAutomation({
                      name: String(fd.get("name") ?? ""),
                      triggerType: String(fd.get("triggerType") ?? "manual"),
                      triggerEvent: String(fd.get("triggerEvent") ?? ""),
                      steps: steps.map((s) => s.kind),
                    });
                    if (r.ok) {
                      toast.success("Automatisation créée");
                      setOpen(false);
                    } else toast.error(r.error ?? "Erreur");
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nom</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="triggerType">Déclencheur</Label>
                  <Select name="triggerType" defaultValue="manual">
                    <SelectTrigger id="triggerType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manuel</SelectItem>
                      <SelectItem value="event">Événement</SelectItem>
                      <SelectItem value="cron">Planifié</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="triggerEvent">Événement (optionnel)</Label>
                  <Input id="triggerEvent" name="triggerEvent" placeholder="pinkevo/lead.created" />
                </div>
                <div className="space-y-2">
                  <Label>Étapes (max 3)</Label>
                  {steps.map((step) => (
                    <Select
                      key={step.id}
                      value={step.kind}
                      onValueChange={(v) =>
                        setSteps((prev) =>
                          prev.map((s) => (s.id === step.id ? { ...s, kind: v } : s)),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STEP_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                  <div className="flex gap-2">
                    {steps.length < 3 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setSteps((p) => [
                            ...p,
                            { id: crypto.randomUUID(), kind: "send_followup" },
                          ])
                        }
                      >
                        + Étape
                      </Button>
                    )}
                    {steps.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSteps((p) => p.slice(0, -1))}
                      >
                        − Retirer
                      </Button>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={pending} className="w-full">
                  Créer
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.slug}>
              <CardHeader>
                <CardTitle className="text-sm">{t.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={pending}
                  onClick={() => act(() => createFromTemplate(t.slug), "Automatisation ajoutée")}
                >
                  Utiliser ce template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">Mes automatisations ({automations.length})</h2>
        {automations.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            Aucune automatisation. Partez d&apos;un template.
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.triggerType} · {a.steps.length} étape
                    {a.steps.length > 1 ? "s" : ""}
                    {a.lastRunAt
                      ? ` · dernier run ${format(new Date(a.lastRunAt), "d MMM HH:mm", { locale: fr })}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={a.enabled}
                      onCheckedChange={(v) =>
                        act(() => toggleAutomation(a.id, v), v ? "Activée" : "Désactivée")
                      }
                    />
                    <Badge variant={a.enabled ? "default" : "outline"}>
                      {a.enabled ? "Active" : "Off"}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => act(() => runAutomationNow(a.id), "Automatisation lancée")}
                  >
                    <Play className="mr-1 size-3.5" /> Lancer
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => act(() => deleteAutomation(a.id), "Supprimée")}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
