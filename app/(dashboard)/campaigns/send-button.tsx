"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendCampaign } from "@/lib/email/campaigns";

export function SendButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending || disabled}
      onClick={() =>
        start(async () => {
          const r = await sendCampaign(id);
          if (r.ok) {
            toast.success(`${r.id} emails envoyés`);
            router.refresh();
          } else toast.error(r.error);
        })
      }
    >
      <Send className="mr-1 size-3.5" /> {pending ? "Envoi…" : "Envoyer"}
    </Button>
  );
}
