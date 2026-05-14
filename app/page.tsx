import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <span className="size-1.5 rounded-full bg-brand-500" />
          PINKEVO OS · v0.1 — scaffolding
        </span>
        <h1 className="bg-gradient-to-br from-foreground via-brand-600 to-accent-purple bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl">
          Le cockpit central
          <br /> de l&apos;agence.
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          CRM, leads, projets, sites, agents IA, automatisations, finance —
          tout en un seul onglet.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild size="lg">
          <Link href="/login">Se connecter</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard">Voir le dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
