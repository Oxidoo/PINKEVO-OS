"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteEmailTemplate } from "@/lib/email/campaigns";

export function TemplateDeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await deleteEmailTemplate(id);
          if (r.ok) toast.success("Template supprimé");
          else toast.error(r.error);
        })
      }
    >
      <Trash2 className="size-4" />
      <span className="sr-only">Supprimer</span>
    </Button>
  );
}
