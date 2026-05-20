"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/crm/activities";

export function ActivityComposer({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    start(async () => {
      const res = await logActivity(formData);
      if (res.ok) {
        toast.success("Activité enregistrée");
        router.refresh();
        formRef.current?.reset();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-3 rounded-xl border p-4">
      <input type="hidden" name="entityType" value="client" />
      <input type="hidden" name="entityId" value={clientId} />
      <div className="flex gap-2">
        <Select name="type" defaultValue="note">
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="call">Appel</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="meeting">RDV</SelectItem>
            <SelectItem value="task">Tâche</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea name="content" placeholder="Ajouter une note d'activité…" rows={2} required />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
