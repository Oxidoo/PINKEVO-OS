"use client";

import { Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EmailTemplate } from "@/lib/db/schema/communications";
import { createCampaign } from "@/lib/email/campaigns";
import { LEAD_CATEGORIES, LEAD_SECTORS } from "../leads/leads-filters";

const VARIABLES = [
  "{{prénom}}",
  "{{nom}}",
  "{{société}}",
  "{{email}}",
  "{{catégorie}}",
  "{{secteur}}",
];

interface Props {
  templates?: EmailTemplate[];
}

export function CampaignCreateDialog({ templates = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [sector, setSector] = useState("");
  const [activeField, setActiveField] = useState<"subject" | "body">("body");
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function handleTemplateSelect(templateId: string) {
    if (templateId === "none") {
      return;
    }
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setSubject(tpl.subject);
      setBody(tpl.bodyHtml);
    }
  }

  function insertVariable(variable: string) {
    if (activeField === "subject" && subjectRef.current) {
      const el = subjectRef.current;
      const start = el.selectionStart ?? subject.length;
      const end = el.selectionEnd ?? subject.length;
      const next = subject.slice(0, start) + variable + subject.slice(end);
      setSubject(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + variable.length, start + variable.length);
      });
    } else if (activeField === "body" && bodyRef.current) {
      const el = bodyRef.current;
      const start = el.selectionStart ?? body.length;
      const end = el.selectionEnd ?? body.length;
      const next = body.slice(0, start) + variable + body.slice(end);
      setBody(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + variable.length, start + variable.length);
      });
    }
  }

  function onSubmit(formData: FormData) {
    formData.set("subject", subject);
    formData.set("message", body);
    if (category) formData.set("category", category);
    if (sector) formData.set("sector", sector);
    start(async () => {
      const res = await createCampaign(formData);
      if (res.ok) {
        toast.success("Campagne créée");
        setOpen(false);
        setSubject("");
        setBody("");
        setCategory("");
        setSector("");
        setActiveField("body");
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouvelle campagne</DialogTitle>
          <DialogDescription>
            Laissez la date vide pour un envoi manuel. Les variables sont remplacées
            automatiquement à l&apos;envoi.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="camp-name">Nom interne</Label>
            <Input id="camp-name" name="name" required maxLength={160} />
          </div>

          {templates.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="camp-template">Template</Label>
              <Select name="templateId" onValueChange={handleTemplateSelect}>
                <SelectTrigger id="camp-template">
                  <SelectValue placeholder="Aucun (personnalisé)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (personnalisé)</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="camp-subject">Objet de l&apos;email</Label>
            <Input
              id="camp-subject"
              name="subject"
              required
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onFocus={() => setActiveField("subject")}
              ref={subjectRef}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-message">Corps du message</Label>
            <Textarea
              id="camp-message"
              name="message"
              rows={8}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onFocus={() => setActiveField("body")}
              ref={bodyRef}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Cliquez sur une variable pour l&apos;insérer dans le champ actif :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <Badge
                  key={v}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => insertVariable(v)}
                >
                  {v}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="camp-category">Catégorie de leads</Label>
              <Select
                name="category"
                value={category}
                onValueChange={(v) => setCategory(v === "all" ? "" : v)}
              >
                <SelectTrigger id="camp-category">
                  <SelectValue placeholder="Tous les leads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les leads</SelectItem>
                  {LEAD_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="camp-sector">Secteur</Label>
              <Select
                name="sector"
                value={sector}
                onValueChange={(v) => setSector(v === "all" ? "" : v)}
              >
                <SelectTrigger id="camp-sector">
                  <SelectValue placeholder="Tous les secteurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les secteurs</SelectItem>
                  {LEAD_SECTORS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-scheduledAt">Programmer (optionnel)</Label>
            <Input id="camp-scheduledAt" name="scheduledAt" type="datetime-local" />
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Création…" : "Créer la campagne"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
