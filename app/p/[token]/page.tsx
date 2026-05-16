import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { getProposalByToken } from "@/lib/proposals/public";
import { AcceptButton } from "./accept-button";

export const metadata = { title: "Proposition" };

interface Content {
  title?: string;
  context?: string;
  objectives?: string[];
  deliverables?: string[];
  timeline?: string;
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
        {accepted && <Badge>Acceptée</Badge>}
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {proposal.title || c.title || "Proposition commerciale"}
        </h1>
      </div>

      {c.context && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-muted-foreground">Contexte</h2>
          <p className="text-sm leading-relaxed">{c.context}</p>
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
          <p className="text-sm">{c.timeline}</p>
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

      <div className="flex flex-col items-start gap-3">
        {accepted ? (
          <p className="text-sm text-success">
            Signée le{" "}
            {proposal.acceptedAt
              ? format(proposal.acceptedAt, "d MMMM yyyy 'à' HH:mm", { locale: fr })
              : ""}
            .
          </p>
        ) : (
          <>
            <AcceptButton token={token} />
            <p className="text-xs text-muted-foreground">
              En cliquant, vous acceptez la proposition. Votre IP et l&apos;horodatage sont
              enregistrés à valeur de signature électronique.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
