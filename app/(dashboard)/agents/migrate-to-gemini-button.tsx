"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setAllAgentsModel } from "@/lib/ai/runs";

export function MigrateToGeminiButton({ targetModel }: { targetModel: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await setAllAgentsModel(targetModel);
          if (r.ok) {
            toast.success(`${r.id ?? "?"} agent(s) basculé(s) sur Gemini`);
            router.refresh();
          } else {
            toast.error(r.error);
          }
        })
      }
    >
      <Sparkles className={`mr-1 size-4 ${pending ? "animate-pulse" : ""}`} />
      {pending ? "Migration…" : "Tout basculer sur Gemini"}
    </Button>
  );
}
