"use client";

import { FileText, Link2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ensureProposalToken } from "@/lib/proposals/actions";

export function ProposalRowActions({ id }: { id: string }) {
  const [pending, start] = useTransition();

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
      >
        <Link2 className="size-4" />
      </Button>
    </div>
  );
}
