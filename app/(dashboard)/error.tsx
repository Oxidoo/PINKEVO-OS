"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error in the browser console; server logs capture the rest.
    console.error("Dashboard error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Une erreur est survenue</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Cette section n&apos;a pas pu se charger. Réessaie, et si le problème persiste contacte le
          support.
        </p>
        {error.digest ? (
          <p className="pt-1 text-xs text-muted-foreground/70">Référence : {error.digest}</p>
        ) : null}
      </div>
      <Button onClick={reset} variant="outline">
        <RotateCcw aria-hidden />
        Réessayer
      </Button>
    </div>
  );
}
