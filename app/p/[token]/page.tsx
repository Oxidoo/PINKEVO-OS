import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, ExternalLink, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAgencySettings } from "@/lib/agency/settings";
import { formatCurrency } from "@/lib/format";
import { getProposalByToken } from "@/lib/proposals/public";
import { SignatureForm } from "./signature-form";

export const metadata = { title: "Devis" };

interface LineItem {
  label: string;
  frequency: string;
  unitPrice: number;
  group: "setup" | "recurring";
}

interface DeliverableGroup {
  service: string;
  items: string[];
  frequency: string;
}

interface AdditionalSection {
  title: string;
  body: string;
}

interface Content {
  title?: string;
  subtitle?: string;
  objectDescription?: string;
  lineItems?: LineItem[];
  deliverables?: DeliverableGroup[];
  conditionsEngagement?: string;
  conditionsBilling?: string;
  conditionsPriceRevision?: string;
  conditionsClientObligations?: string;
  additionalSections?: AdditionalSection[];
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
  const agency = await getAgencySettings();
  const accepted = proposal.status === "accepted";
  const setupItems = (c.lineItems ?? []).filter((i) => i.group === "setup");
  const recurringItems = (c.lineItems ?? []).filter((i) => i.group === "recurring");
  const totalSetup = Number(proposal.totalSetup);
  const totalRecurring = Number(proposal.totalRecurring);
  const grandTotal = totalSetup + totalRecurring;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-10">
      {/* En-tête */}
      <header className="border-b border-brand-200 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-brand-600">PINKEVO</span>
          {proposal.number && (
            <span className="font-mono text-sm font-semibold text-brand-700">
              {proposal.number}
            </span>
          )}
        </div>
        {accepted && (
          <Badge className="mt-2" variant="default">
            <CheckCircle2 className="mr-1 size-3" /> Devis signé
          </Badge>
        )}
      </header>

      {/* Titre */}
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {proposal.title || c.title || "Devis de prestation de services"}
        </h1>
        {c.subtitle && <p className="text-muted-foreground italic">{c.subtitle}</p>}
      </div>

      {/* Prestataire + Client */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-brand-50/50 p-4">
          <p className="text-xs font-semibold text-brand-700">PRESTATAIRE</p>
          <p className="mt-1 font-semibold">{agency?.legalName ?? "—"}</p>
          {agency?.legalStatus && (
            <p className="text-xs text-muted-foreground">{agency.legalStatus}</p>
          )}
          {agency?.siret && <p className="text-xs">SIRET : {agency.siret}</p>}
          {agency?.email && <p className="text-xs">{agency.email}</p>}
          {agency?.phone && <p className="text-xs">{agency.phone}</p>}
        </div>
        <div className="rounded-lg bg-brand-50/50 p-4">
          <p className="text-xs font-semibold text-brand-700">CLIENT</p>
          <p className="mt-1 font-semibold">—</p>
          <p className="mt-2 text-xs">
            <span className="font-semibold">Date : </span>
            {format(proposal.createdAt, "d MMMM yyyy", { locale: fr })}
          </p>
        </div>
      </div>

      {/* 1. Objet */}
      {c.objectDescription && (
        <section>
          <h2 className="mb-2 rounded bg-brand-600 px-3 py-1.5 text-sm font-bold text-white">
            1. OBJET DU DEVIS
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">{c.objectDescription}</p>
        </section>
      )}

      {/* 2. Récap financier */}
      <section>
        <h2 className="mb-2 rounded bg-brand-600 px-3 py-1.5 text-sm font-bold text-white">
          2. RÉCAPITULATIF FINANCIER
        </h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-50 text-brand-700">
                <th className="px-3 py-2 text-left">Désignation</th>
                <th className="px-3 py-2 text-center">Fréquence</th>
                <th className="px-3 py-2 text-right">P.U. HT</th>
                <th className="px-3 py-2 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {setupItems.length > 0 && (
                <>
                  <tr className="bg-brand-100/50">
                    <td colSpan={4} className="px-3 py-1.5 text-xs font-bold text-brand-700">
                      FRAIS DE MISE EN SERVICE
                    </td>
                  </tr>
                  {setupItems.map((it, i) => (
                    <tr key={`s-${i}`} className="border-t">
                      <td className="px-3 py-2">{it.label}</td>
                      <td className="px-3 py-2 text-center">{it.frequency}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(it.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(it.unitPrice)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/30 font-medium">
                    <td colSpan={3} className="px-3 py-1.5">
                      Sous-total mise en service
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatCurrency(totalSetup)}
                    </td>
                  </tr>
                </>
              )}
              {recurringItems.length > 0 && (
                <>
                  <tr className="bg-brand-100/50 border-t">
                    <td colSpan={4} className="px-3 py-1.5 text-xs font-bold text-brand-700">
                      ABONNEMENT MENSUEL RÉCURRENT
                    </td>
                  </tr>
                  {recurringItems.map((it, i) => (
                    <tr key={`r-${i}`} className="border-t">
                      <td className="px-3 py-2">{it.label}</td>
                      <td className="px-3 py-2 text-center">{it.frequency}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(it.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(it.unitPrice)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/30 font-medium">
                    <td colSpan={3} className="px-3 py-1.5">
                      Sous-total abonnement mensuel
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatCurrency(totalRecurring)}
                    </td>
                  </tr>
                </>
              )}
              <tr className="bg-brand-600 text-white">
                <td colSpan={3} className="px-3 py-2 font-bold">
                  TOTAL 1ÈRE ÉCHÉANCE
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {agency?.vatRegime && (
          <p className="mt-1 text-xs italic text-muted-foreground">{agency.vatRegime}</p>
        )}
      </section>

      {/* 3. Livrables */}
      {c.deliverables && c.deliverables.length > 0 && (
        <section>
          <h2 className="mb-2 rounded bg-brand-600 px-3 py-1.5 text-sm font-bold text-white">
            3. LIVRABLES DÉTAILLÉS
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-50 text-brand-700">
                  <th className="px-3 py-2 text-left">Service</th>
                  <th className="px-3 py-2 text-left">Livrables inclus</th>
                  <th className="px-3 py-2 text-left">Fréquence</th>
                </tr>
              </thead>
              <tbody>
                {c.deliverables.map((d, i) => (
                  <tr key={i} className="border-t align-top">
                    <td className="px-3 py-2 font-semibold text-brand-700">{d.service}</td>
                    <td className="px-3 py-2">
                      <ul className="space-y-0.5">
                        {d.items.map((it, j) => (
                          <li key={j}>• {it}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-3 py-2 italic text-muted-foreground">{d.frequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. Conditions */}
      <section>
        <h2 className="mb-2 rounded bg-brand-600 px-3 py-1.5 text-sm font-bold text-white">
          4. CONDITIONS DE L&apos;ABONNEMENT
        </h2>
        {c.conditionsEngagement && (
          <div className="mt-3">
            <h3 className="text-sm font-semibold text-brand-700">4.1 Durée d&apos;engagement</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed">{c.conditionsEngagement}</p>
          </div>
        )}
        {c.conditionsBilling && (
          <div className="mt-3">
            <h3 className="text-sm font-semibold text-brand-700">4.2 Facturation & paiement</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed">{c.conditionsBilling}</p>
          </div>
        )}
        {c.conditionsPriceRevision && (
          <div className="mt-3">
            <h3 className="text-sm font-semibold text-brand-700">4.3 Révision tarifaire</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {c.conditionsPriceRevision}
            </p>
          </div>
        )}
        {c.conditionsClientObligations && (
          <div className="mt-3">
            <h3 className="text-sm font-semibold text-brand-700">4.4 Obligations du client</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {c.conditionsClientObligations}
            </p>
          </div>
        )}
      </section>

      {/* Sections additionnelles */}
      {c.additionalSections?.map((sec, idx) => (
        <section key={idx}>
          <h2 className="mb-2 rounded bg-brand-600 px-3 py-1.5 text-sm font-bold uppercase text-white">
            {`${5 + idx}. ${sec.title}`}
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">{sec.body}</p>
        </section>
      ))}

      {/* Signature ou Paiement */}
      <section className="rounded-xl border-2 border-brand-500 bg-brand-50/30 p-6">
        {accepted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-5" />
              <p className="font-semibold">Devis signé électroniquement</p>
            </div>
            {proposal.signatureName && (
              <p className="text-sm">
                <span className="text-muted-foreground">Par : </span>
                <span className="font-medium">{proposal.signatureName}</span>
              </p>
            )}
            {proposal.acceptedAt && (
              <p className="text-sm">
                <span className="text-muted-foreground">Le : </span>
                {format(proposal.acceptedAt, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            )}

            {proposal.paymentLinkUrl && (
              <div className="mt-6 rounded-lg border border-brand-300 bg-white p-4">
                <p className="text-sm font-semibold">Procéder au règlement</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {proposal.paymentLinkLabel ?? "Réglez en ligne en quelques secondes."}
                </p>
                <Button asChild className="mt-3 w-full sm:w-auto">
                  <a href={proposal.paymentLinkUrl} target="_blank" rel="noreferrer">
                    Payer {formatCurrency(grandTotal)}
                    <ExternalLink className="ml-2 size-3.5" />
                  </a>
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Vous pouvez télécharger une copie PDF signée du devis ci-dessous.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/proposals/public/${token}/pdf`} target="_blank" rel="noreferrer">
                <FileText className="mr-1 size-4" />
                Télécharger le PDF signé
              </a>
            </Button>
          </div>
        ) : (
          <SignatureForm token={token} grandTotal={grandTotal} />
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Devis {proposal.number ?? ""} ·{" "}
        {agency?.legalName ?? "PINKEVO"} ·{" "}
        {agency?.vatRegime ?? "TVA non applicable, art. 293 B du CGI"}
      </p>
    </main>
  );
}
