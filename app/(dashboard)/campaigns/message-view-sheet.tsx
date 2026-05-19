"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Props {
  message: {
    id: string;
    toEmail: string;
    subject: string;
    bodyHtml: string | null;
    createdAt: Date;
  } | null;
  open: boolean;
  onClose: () => void;
}

export function MessageViewSheet({ message, open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{message?.subject ?? ""}</SheetTitle>
          {message && (
            <p className="text-sm text-muted-foreground">
              À&nbsp;: {message.toEmail} &mdash;{" "}
              {format(message.createdAt, "d MMMM yyyy à HH:mm", { locale: fr })}
            </p>
          )}
        </SheetHeader>

        <div className="mt-6">
          {message?.bodyHtml ? (
            <iframe
              srcDoc={message.bodyHtml}
              style={{ width: "100%", height: "60vh", border: "none" }}
              sandbox=""
              title="Aperçu du message"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Aucun contenu disponible.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
