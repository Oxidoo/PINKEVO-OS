"use client";

import { Gauge } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runFullAudit } from "@/lib/websites/actions";

export function AuditButton({ websiteId }: { websiteId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await runFullAudit(websiteId);
          if (r.ok) toast.success("Audit SEO + perf lancé");
          else toast.error(r.error);
        })
      }
    >
      <Gauge className="mr-1 size-4" />
      {pending ? "Audit en cours…" : "Audit complet maintenant"}
    </Button>
  );
}
