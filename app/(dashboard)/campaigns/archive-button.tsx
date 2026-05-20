"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { archiveCampaign, deleteCampaign, unarchiveCampaign } from "@/lib/email/campaigns";

export function ArchiveButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await archiveCampaign(id);
          if (r.ok) {
            toast.success("Campagne archivée");
            router.refresh();
          } else toast.error(r.error);
        })
      }
    >
      <Archive className="size-3.5" />
    </Button>
  );
}

export function DeleteCampaignButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm("Supprimer définitivement cette campagne ?")) return;
        start(async () => {
          const r = await deleteCampaign(id);
          if (r.ok) {
            toast.success("Campagne supprimée");
            router.refresh();
          } else toast.error(r.error);
        });
      }}
    >
      <Trash2 className="size-3.5 text-destructive" />
    </Button>
  );
}

export function UnarchiveButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await unarchiveCampaign(id);
          if (r.ok) {
            toast.success("Campagne restaurée");
            router.refresh();
          } else toast.error(r.error);
        })
      }
    >
      <ArchiveRestore className="size-3.5" />
    </Button>
  );
}
