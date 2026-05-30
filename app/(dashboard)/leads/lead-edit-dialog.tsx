"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLead } from "@/lib/crm/leads";
import type { Lead } from "@/lib/db/schema";
import { CATEGORY_SECTORS, LEAD_CATEGORIES, LEAD_SECTORS } from "./leads-filters";

export function LeadEditDialog({
  lead,
  open,
  onClose,
  onSaved,
}: {
  lead: Lead;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Lead) => void;
}) {
  const [category, setCategory] = useState(lead.category ?? "");
  const [sector, setSector] = useState(lead.sector ?? "");
  const [pending, start] = useTransition();

  const sectorsForCategory = category ? (CATEGORY_SECTORS[category] ?? LEAD_SECTORS) : LEAD_SECTORS;

  function handleCategoryChange(v: string) {
    setCategory(v);
    setSector("");
  }

  function onSubmit(formData: FormData) {
    if (category) formData.set("category", category);
    else formData.delete("category");
    if (sector) formData.set("sector", sector);
    else formData.delete("sector");
    start(async () => {
      const res = await updateLead(lead.id, formData);
      if (res.ok) {
        toast.success("Lead mis à jour");
        onSaved({
          ...lead,
          firstName: (formData.get("firstName") as string) || null,
          lastName: (formData.get("lastName") as string) || null,
          email: (formData.get("email") as string) || null,
          phone: (formData.get("phone") as string) || null,
          company: (formData.get("company") as string) || null,
          zone: (formData.get("zone") as string) || null,
          category: category || null,
          sector: sector || null,
        });
        onClose();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le lead</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-firstName">Prénom</Label>
            <Input id="edit-firstName" name="firstName" defaultValue={lead.firstName ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-lastName">Nom</Label>
            <Input id="edit-lastName" name="lastName" defaultValue={lead.lastName ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" name="email" type="email" defaultValue={lead.email ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Téléphone</Label>
            <Input id="edit-phone" name="phone" defaultValue={lead.phone ?? ""} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="edit-company">Société</Label>
            <Input id="edit-company" name="company" defaultValue={lead.company ?? ""} />
          </div>

          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner…" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Secteur</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner…" />
              </SelectTrigger>
              <SelectContent>
                {sectorsForCategory.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="edit-zone">Zone (ville, région…)</Label>
            <Input id="edit-zone" name="zone" defaultValue={lead.zone ?? ""} />
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
