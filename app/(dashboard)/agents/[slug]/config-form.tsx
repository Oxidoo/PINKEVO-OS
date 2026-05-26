"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_MODELS } from "@/lib/ai/models";
import { updateAgentConfig } from "@/lib/ai/runs";
import type { Agent } from "@/lib/db/schema";

export function ConfigForm({ agent }: { agent: Agent }) {
  const [pending, start] = useTransition();
  const [model, setModel] = useState(agent.model);
  const [enabled, setEnabled] = useState(agent.enabled);

  function onSubmit(formData: FormData) {
    start(async () => {
      const res = await updateAgentConfig(agent.id, {
        systemPrompt: String(formData.get("systemPrompt") ?? ""),
        model,
        enabled,
      });
      if (res.ok) toast.success("Configuration enregistrée");
      else toast.error(res.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="enabled">Agent activé</Label>
          <p className="text-xs text-muted-foreground">Désactivé = lancement bloqué</p>
        </div>
        <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="model">Modèle LLM par défaut</Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger id="model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
        <p className="text-xs text-muted-foreground">
          Ce modèle est utilisé pour tous les lancements, sauf surcharge ponctuelle au moment du
          lancement.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="systemPrompt">Prompt système</Label>
        <Textarea
          id="systemPrompt"
          name="systemPrompt"
          rows={8}
          defaultValue={agent.systemPrompt}
          className="font-mono text-xs"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
