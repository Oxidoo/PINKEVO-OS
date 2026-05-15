"use client";

import { useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient, updateClient } from "@/lib/crm/clients";
import type { Client } from "@/lib/db/schema";

const STATUS = [
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Actif" },
  { value: "churned", label: "Churned" },
] as const;

export function ClientForm({ client, onDone }: { client?: Client; onDone?: () => void }) {
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    start(async () => {
      const res = client ? await updateClient(client.id, formData) : await createClient(formData);
      if (res.ok) {
        toast.success(client ? "Client mis à jour" : "Client créé");
        onDone?.();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="name">Nom *</Label>
        <Input id="name" name="name" defaultValue={client?.name} required maxLength={160} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="company">Société</Label>
        <Input id="company" name="company" defaultValue={client?.company ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="industry">Secteur</Label>
        <Input id="industry" name="industry" defaultValue={client?.industry ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Statut</Label>
        <Select name="status" defaultValue={client?.status ?? "prospect"}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mrr">MRR (€)</Label>
        <Input
          id="mrr"
          name="mrr"
          type="number"
          min={0}
          step="0.01"
          defaultValue={client ? Number(client.mrr) : 0}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="tags">Tags (séparés par virgule)</Label>
        <Input id="tags" name="tags" defaultValue={client?.tags?.join(", ") ?? ""} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} rows={3} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Enregistrement…" : client ? "Mettre à jour" : "Créer le client"}
        </Button>
      </div>
    </form>
  );
}
