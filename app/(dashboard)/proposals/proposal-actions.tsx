"use client";

import { FileText, Link2, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteProposal,
  ensureProposalToken,
  markProposalSent,
} from "@/lib/proposals/actions";

export function ProposalRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const canMarkSent = status === "draft";

  function copyLink() {
    start(async () => {
      const token = await ensureProposalToken(id);
      if (!token) {
        toast.error("Lien indisponible");
        return;
      }
      const url = `${window.location.origin}/p/${token}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Lien de signature copié");
    });
  }

  function onSend() {
    start(async () => {
      const r = await markProposalSent(id);
      if (r.ok) {
        toast.success("Marqué comme envoyé");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  function onDelete() {
    if (!confirm("Supprimer définitivement ce devis ?")) return;
    start(async () => {
      const r = await deleteProposal(id);
      if (r.ok) {
        toast.success("Devis supprimé");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <Button asChild size="icon" variant="ghost" aria-label="PDF">
        <a href={`/api/proposals/${id}/pdf`} target="_blank" rel="noreferrer">
          <FileText className="size-4" />
        </a>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={copyLink}
        disabled={pending}
        aria-label="Copier le lien de signature"
        title="Copier le lien de signature"
      >
        <Link2 className="size-4" />
      </Button>
      {canMarkSent && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onSend}
          disabled={pending}
          aria-label="Marquer comme envoyé"
          title="Marquer comme envoyé"
        >
          <Send className="size-4" />
        </Button>
      )}
      <Button
        size="icon"
        variant="ghost"
        onClick={onDelete}
        disabled={pending}
        aria-label="Supprimer"
        title="Supprimer"
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
