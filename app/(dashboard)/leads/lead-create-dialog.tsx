"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { createLead } from "@/lib/crm/leads";
import { CATEGORY_SECTORS, LEAD_CATEGORIES, LEAD_SECTORS } from "./leads-filters";

export function LeadCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [sector, setSector] = useState("");
  const [pending, start] = useTransition();

  const sectorsForCategory = category ? (CATEGORY_SECTORS[category] ?? LEAD_SECTORS) : LEAD_SECTORS;

  function handleCategoryChange(v: string) {
    setCategory(v);
    setSector(""); // reset sector when category changes
  }

  function onSubmit(formData: FormData) {
    if (category) formData.set("category", category);
    if (sector) formData.set("sector", sector);
    start(async () => {
      const res = await createLead(formData);
      if (res.ok) {
        toast.success("Lead créé");
        router.refresh();
        setOpen(false);
        setCategory("");
        setSector("");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> Nouveau lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau lead</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" name="firstName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" name="lastName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="company">Société</Label>
            <Input id="company" name="company" />
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
            <Label htmlFor="zone">Zone (ville, région…)</Label>
            <Input id="zone" name="zone" placeholder="Ex : Lyon, Nord 59, Paris 75…" />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Création…" : "Créer le lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
