"use client";

import { Link as LinkIcon, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { updateEmailTemplate } from "@/lib/email/campaigns";
import { LinkInsertForm } from "./link-insert-form";

const VARIABLES = [
  "{{prénom}}",
  "{{nom}}",
  "{{société}}",
  "{{email}}",
  "{{catégorie}}",
  "{{secteur}}",
];

const CATEGORIES = [
  { value: "outreach", label: "Prospection" },
  { value: "follow_up", label: "Suivi" },
  { value: "proposal", label: "Proposition" },
  { value: "invoice", label: "Facture" },
  { value: "transactional", label: "Transactionnel" },
];

interface Props {
  template: EmailTemplate;
}

export function TemplateEditDialog({ template }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.bodyHtml);
  const [activeField, setActiveField] = useState<"subject" | "body">("body");
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [showLinkForm, setShowLinkForm] = useState(false);

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
    formData.set("body", body);
    start(async () => {
      const res = await updateEmailTemplate(template.id, formData);
      if (res.ok) {
        toast.success("Template mis à jour");
        router.refresh();
        setOpen(false);
        setActiveField("body");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="size-4" />
          <span className="sr-only">Modifier le template</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier le template</DialogTitle>
          <DialogDescription>
            Modifiez le modèle. Les variables sont remplacées automatiquement à l&apos;envoi.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-tpl-name">Nom du template</Label>
            <Input
              id="edit-tpl-name"
              name="name"
              required
              maxLength={160}
              defaultValue={template.name}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-tpl-category">Catégorie</Label>
            <Select name="category" defaultValue={template.category}>
              <SelectTrigger id="edit-tpl-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-tpl-subject">Objet de l&apos;email</Label>
            <Input
              id="edit-tpl-subject"
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
            <Label htmlFor="edit-tpl-body">Corps du message</Label>
            <Textarea
              id="edit-tpl-body"
              name="body"
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
            <div className="flex flex-wrap items-center gap-1.5">
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
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowLinkForm((p) => !p)}
              >
                <LinkIcon className="mr-1 size-3" />
                Insérer un lien
              </Button>
            </div>

            {showLinkForm && (
              <LinkInsertForm
                onInsert={(md) => {
                  insertVariable(md);
                  setShowLinkForm(false);
                }}
                onCancel={() => setShowLinkForm(false)}
              />
            )}
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Mise à jour…" : "Enregistrer les modifications"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
