"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncGoogleCalendar } from "@/lib/calendar/actions";

export function SyncButton({ connected }: { connected: boolean }) {
  const [pending, start] = useTransition();

  if (!connected) {
    return (
      <Button asChild variant="outline">
        <a href="/api/google/connect">Connecter Google Calendar</a>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await syncGoogleCalendar();
          if (r.ok) toast.success(`${r.id} événements synchronisés`);
          else toast.error(r.error);
        })
      }
    >
      <RefreshCw className={`mr-1 size-4 ${pending ? "animate-spin" : ""}`} />
      Sync Google
    </Button>
  );
}
