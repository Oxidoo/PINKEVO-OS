"use client";

import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { createCampaign } from "@/lib/email/campaigns";

export function CampaignCreateDialog() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    start(async () => {
      const res = await createCampaign(formData);
      if (res.ok) {
        toast.success("Campagne créée");
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
          <Plus className="mr-1 size-4" /> Nouvelle campagne
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle campagne</DialogTitle>
          <DialogDescription>
            Audience : tous les leads disposant d&apos;un email. Laissez la date vide pour un envoi
            manuel.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom interne</Label>
            <Input id="name" name="name" required maxLength={160} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Objet de l&apos;email</Label>
            <Input id="subject" name="subject" required maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" rows={5} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scheduledAt">Programmer (optionnel)</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Création…" : "Créer la campagne"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
