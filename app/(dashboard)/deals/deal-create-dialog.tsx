"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { createDeal } from "@/lib/crm/deals";
import type { Client } from "@/lib/db/schema";

export function DealCreateDialog({ clients }: { clients: Pick<Client, "id" | "name">[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    start(async () => {
      const res = await createDeal(formData);
      if (res.ok) {
        toast.success("Deal créé");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> Nouveau deal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau deal</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">Titre *</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="value">Montant (€)</Label>
            <Input id="value" name="value" type="number" min={0} step="0.01" defaultValue={0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stage">Étape</Label>
            <Select name="stage" defaultValue="discovery">
              <SelectTrigger id="stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discovery">Découverte</SelectItem>
                <SelectItem value="proposal">Proposition</SelectItem>
                <SelectItem value="negotiation">Négociation</SelectItem>
                <SelectItem value="won">Gagné</SelectItem>
                <SelectItem value="lost">Perdu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="clientId">Client</Label>
            <Select name="clientId">
              <SelectTrigger id="clientId">
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="expectedCloseDate">Clôture estimée</Label>
            <Input id="expectedCloseDate" name="expectedCloseDate" type="date" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Création…" : "Créer le deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
