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
import { addExpense, addToolSubscription } from "@/lib/finance/actions";

export function AddExpenseDialog() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 size-4" /> Dépense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle dépense</DialogTitle>
        </DialogHeader>
        <form
          action={(fd) =>
            start(async () => {
              const r = await addExpense(fd);
              if (r.ok) {
                toast.success("Dépense ajoutée");
                setOpen(false);
              } else toast.error(r.error);
            })
          }
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="category">Catégorie</Label>
            <Select name="category" defaultValue="tool">
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tool">Outil</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="salary">Salaire</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor">Fournisseur</Label>
            <Input id="vendor" name="vendor" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Montant (€)</Label>
            <Input id="amount" name="amount" type="number" min={0} step="0.01" required />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Ajout…" : "Ajouter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddToolDialog() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 size-4" /> Outil
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel abonnement outil</DialogTitle>
        </DialogHeader>
        <form
          action={(fd) =>
            start(async () => {
              const r = await addToolSubscription(fd);
              if (r.ok) {
                toast.success("Outil ajouté");
                setOpen(false);
              } else toast.error(r.error);
            })
          }
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tvendor">Éditeur</Label>
            <Input id="tvendor" name="vendor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monthlyCost">Coût mensuel (€)</Label>
              <Input
                id="monthlyCost"
                name="monthlyCost"
                type="number"
                min={0}
                step="0.01"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seats">Sièges</Label>
              <Input id="seats" name="seats" type="number" min={0} />
            </div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Ajout…" : "Ajouter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
