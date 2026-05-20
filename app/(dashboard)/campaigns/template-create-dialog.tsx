"use client";

import { Link as LinkIcon, Plus } from "lucide-react";
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
import { createEmailTemplate } from "@/lib/email/campaigns";

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

export function TemplateCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [activeField, setActiveField] = useState<"subject" | "body">("body");
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

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

  function insertLink() {
    if (!linkText || !linkUrl) return;
    insertVariable(`[${linkText}](${linkUrl})`);
    setLinkText("");
    setLinkUrl("");
    setShowLinkForm(false);
  }

  function onSubmit(formData: FormData) {
    formData.set("subject", subject);
    formData.set("body", body);
    start(async () => {
      const res = await createEmailTemplate(formData);
      if (res.ok) {
        toast.success("Template créé");
        router.refresh();
        setOpen(false);
        setSubject("");
        setBody("");
        setActiveField("body");
        setShowLinkForm(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-1 size-4" /> Nouveau template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouveau template email</DialogTitle>
          <DialogDescription>
            Créez un modèle réutilisable avec des variables personnalisées.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">Nom du template</Label>
            <Input id="tpl-name" name="name" required maxLength={160} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-category">Catégorie</Label>
            <Select name="category" defaultValue="outreach">
              <SelectTrigger id="tpl-category">
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
            <Label htmlFor="tpl-subject">Objet de l&apos;email</Label>
            <Input
              id="tpl-subject"
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
            <Label htmlFor="tpl-body">Corps du message</Label>
            <Textarea
              id="tpl-body"
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
              <div className="rounded-lg border p-3 space-y-2">
                <Input
                  placeholder="Texte du lien"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  type="url"
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={insertLink}>
                    Insérer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowLinkForm(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Création…" : "Créer le template"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
