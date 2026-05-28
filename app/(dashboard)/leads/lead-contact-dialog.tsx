"use client";

import { CalendarClock, Mail, Phone, MessageSquare } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactLead } from "@/lib/crm/leads";

type Method = "call" | "email" | "sms";

const METHODS: { value: Method; label: string; icon: React.ElementType; color: string }[] = [
  { value: "call", label: "Appel", icon: Phone, color: "text-green-600" },
  { value: "email", label: "Email", icon: Mail, color: "text-blue-600" },
  { value: "sms", label: "SMS", icon: MessageSquare, color: "text-orange-500" },
];

export function LeadContactDialog({
  leadId,
  leadName,
  open,
  onClose,
  onDone,
}: {
  leadId: string;
  leadName: string;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [method, setMethod] = useState<Method>("call");
  const [note, setNote] = useState("");
  const [followupAt, setFollowupAt] = useState("");
  const [pending, start] = useTransition();

  function handleClose() {
    setNote("");
    setMethod("call");
    setFollowupAt("");
    onClose();
  }

  function handleSubmit() {
    start(async () => {
      const r = await contactLead(leadId, method, note, followupAt || null);
      if (r.ok) {
        toast.success(
          followupAt
            ? "Contact enregistré + rappel planifié"
            : "Contact enregistré — lead déplacé dans « Contacté »",
        );
        handleClose();
        onDone();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un contact · {leadName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Mode de contact</Label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethod(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors ${
                    method === value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-border bg-muted/20 text-muted-foreground hover:border-brand-300 hover:bg-brand-50/50"
                  }`}
                >
                  <Icon className={`size-5 ${method === value ? "text-brand-600" : color}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">
              Note{" "}
              <span className="font-normal text-muted-foreground">(optionnel)</span>
            </Label>
            <Textarea
              id="note"
              placeholder={
                method === "call"
                  ? "Ex : à recontacter dans 6 mois, intéressé par le pack SEO…"
                  : method === "email"
                    ? "Ex : envoyé devis, en attente de réponse…"
                    : "Ex : SMS envoyé, pas de réponse…"
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="followup" className="flex items-center gap-1.5">
              <CalendarClock className="size-4" />
              Planifier un rappel{" "}
              <span className="font-normal text-muted-foreground">(optionnel)</span>
            </Label>
            <Input
              id="followup"
              type="datetime-local"
              value={followupAt}
              onChange={(e) => setFollowupAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-muted-foreground">
              La note ci-dessus sera attachée au rappel.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={pending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer le contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
