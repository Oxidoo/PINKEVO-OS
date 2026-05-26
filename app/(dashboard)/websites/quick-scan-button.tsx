"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runQuickPsiScan } from "@/lib/websites/actions";

export function QuickScanButton({ websiteId }: { websiteId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await runQuickPsiScan(websiteId);
          if (r.ok) {
            toast.success("Audit PSI à jour");
            router.refresh();
          } else {
            toast.error(r.error);
          }
        })
      }
    >
      <RefreshCw className={`mr-1 size-4 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Analyse…" : "Re-scanner"}
    </Button>
  );
}
