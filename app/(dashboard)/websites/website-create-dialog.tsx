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
import { createWebsite } from "@/lib/websites/actions";

export function WebsiteCreateDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> Nouveau site
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau site</DialogTitle>
        </DialogHeader>
        <form
          action={(fd) =>
            start(async () => {
              const r = await createWebsite(fd);
              if (r.ok) {
                toast.success("Site ajouté");
                setOpen(false);
              } else toast.error(r.error);
            })
          }
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="clientId">Client</Label>
            <Select name="clientId">
              <SelectTrigger id="clientId">
                <SelectValue placeholder="Choisir…" />
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
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input id="url" name="url" type="url" placeholder="https://…" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cms">CMS</Label>
            <Select name="cms" defaultValue="other">
              <SelectTrigger id="cms">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webflow">Webflow</SelectItem>
                <SelectItem value="framer">Framer</SelectItem>
                <SelectItem value="wordpress">WordPress</SelectItem>
                <SelectItem value="next">Next.js</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Ajout…" : "Ajouter le site"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
