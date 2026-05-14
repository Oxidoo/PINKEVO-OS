import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PROVIDERS = [
  { slug: "google", name: "Google", description: "Calendar + Search Console (OAuth)", phase: "Phase 5/7" },
  { slug: "cal_com", name: "Cal.com", description: "Bookings publics + webhooks", phase: "Phase 5" },
  { slug: "stripe", name: "Stripe", description: "Subscriptions, factures, MRR", phase: "Phase 6" },
  { slug: "resend", name: "Resend", description: "Envoi d'emails transactionnels & campagnes", phase: "Phase 3" },
  { slug: "telegram", name: "Telegram", description: "Reporting quotidien + commandes", phase: "Phase 10" },
  { slug: "pappers", name: "Pappers", description: "Enrichissement leads FR (SIREN, CA)", phase: "Phase 2" },
  { slug: "anthropic", name: "Anthropic", description: "Claude pour les agents IA", phase: "Phase 4" },
  { slug: "openai", name: "OpenAI", description: "GPT pour agents IA alternatifs", phase: "Phase 4" },
  { slug: "elevenlabs", name: "ElevenLabs", description: "Briefings audio TTS optionnels", phase: "Phase 5" },
] as const;

export function IntegrationsPanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PROVIDERS.map((p) => (
        <Card key={p.slug}>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{p.name}</CardTitle>
              <CardDescription className="mt-1 text-xs">{p.description}</CardDescription>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {p.phase}
            </Badge>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Connecter (bientôt)
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
