"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateAgentConfig } from "@/lib/ai/runs";
import type { Agent } from "@/lib/db/schema";

export function ConfigForm({ agent }: { agent: Agent }) {
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    start(async () => {
      const res = await updateAgentConfig(agent.id, {
        systemPrompt: String(formData.get("systemPrompt") ?? ""),
        model: String(formData.get("model") ?? agent.model),
        enabled: formData.get("enabled") === "on",
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
        <Switch id="enabled" name="enabled" defaultChecked={agent.enabled} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="model">Modèle</Label>
        <Input id="model" name="model" defaultValue={agent.model} />
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
