"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { archiveCampaign, unarchiveCampaign } from "@/lib/email/campaigns";

export function ArchiveButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await archiveCampaign(id);
          if (r.ok) toast.success("Campagne archivée");
          else toast.error(r.error);
        })
      }
    >
      <Archive className="size-3.5" />
    </Button>
  );
}

export function UnarchiveButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await unarchiveCampaign(id);
          if (r.ok) toast.success("Campagne restaurée");
          else toast.error(r.error);
        })
      }
    >
      <ArchiveRestore className="size-3.5" />
    </Button>
  );
}
