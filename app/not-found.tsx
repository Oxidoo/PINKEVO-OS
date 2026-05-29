import { Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-muted/30 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
        <Compass className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Erreur 404</p>
        <h1 className="text-xl font-semibold">Page introuvable</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          La page que tu cherches n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
