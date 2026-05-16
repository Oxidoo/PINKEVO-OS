"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptProposal } from "@/lib/proposals/public";

export function AcceptButton({ token }: { token: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await acceptProposal(token);
          if (r.ok) toast.success("Proposition acceptée et signée. Merci !");
          else toast.error(r.error ?? "Erreur");
        })
      }
    >
      {pending ? "Signature…" : "Accepter & signer"}
    </Button>
  );
}
