import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { getProposalByToken } from "@/lib/proposals/public";
import { SignatureForm } from "./signature-form";

export const metadata = { title: "Proposition" };

interface Content {
  title?: string;
  context?: string;
  objectives?: string[];
  deliverables?: string[];
  timeline?: string;
  conditions?: string;
}

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposal = await getProposalByToken(token);
  if (!proposal) notFound();
  const c = (proposal.content ?? {}) as Content;
  const accepted = proposal.status === "accepted";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-brand-600">PINKEVO</span>
        {accepted && <Badge>Signée</Badge>}
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {proposal.title || c.title || "Proposition commerciale"}
        </h1>
      </div>

      {c.context && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-muted-foreground">Contexte</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">{c.context}</p>
        </section>
      )}

      {c.objectives?.length ? (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-muted-foreground">Objectifs</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {c.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {c.deliverables?.length ? (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-muted-foreground">Livrables</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {c.deliverables.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {c.timeline && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-muted-foreground">Planning</h2>
          <p className="whitespace-pre-line text-sm">{c.timeline}</p>
        </section>
      )}

      <div className="rounded-xl border bg-brand-50/50 p-5">
        <div className="flex justify-between text-sm">
          <span>Mise en place</span>
          <span className="font-medium">{formatCurrency(proposal.totalSetup)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span>Abonnement mensuel</span>
          <span className="font-medium">{formatCurrency(proposal.totalRecurring)}</span>
        </div>
      </div>

      {proposal.paymentLinkUrl && (
        <div className="rounded-xl border border-brand-200 bg-white p-5">
          <p className="text-sm font-medium">Paiement sécurisé</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {proposal.paymentLinkLabel ?? "Réglez en ligne en quelques secondes."}
          </p>
          <Button asChild className="mt-3">
            <a href={proposal.paymentLinkUrl} target="_blank" rel="noreferrer">
              Payer maintenant
              <ExternalLink className="ml-2 size-3.5" />
            </a>
          </Button>
        </div>
      )}

      {c.conditions && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-muted-foreground">Conditions</h2>
          <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
            {c.conditions}
          </p>
        </section>
      )}

      <div className="rounded-xl border p-5">
        {accepted ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium text-success">Devis signé électroniquement</p>
            {proposal.signatureName && (
              <p className="text-muted-foreground">Par : {proposal.signatureName}</p>
            )}
            {proposal.acceptedAt && (
              <p className="text-muted-foreground">
                Le{" "}
                {format(proposal.acceptedAt, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            )}
          </div>
        ) : (
          <SignatureForm token={token} />
        )}
      </div>
    </main>
  );
}
