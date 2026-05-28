import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { AgencySettings } from "@/lib/db/schema";

export interface ProposalLineItem {
  label: string;
  frequency: string;
  unitPrice: number;
  group: "setup" | "recurring";
}

export interface DeliverableGroup {
  service: string;
  items: string[];
  frequency: string;
}

export interface AdditionalSection {
  title: string;
  body: string;
}

export interface ProposalSignature {
  name: string;
  signedAt: Date | string;
  ip?: string | null;
}

export interface ProposalContent {
  title?: string;
  subtitle?: string;
  objectDescription?: string;
  lineItems?: ProposalLineItem[];
  deliverables?: DeliverableGroup[];
  conditionsEngagement?: string;
  conditionsBilling?: string;
  conditionsPriceRevision?: string;
  conditionsClientObligations?: string;
  additionalSections?: AdditionalSection[];
}

export interface ProposalPdfInput {
  number: string;
  content: ProposalContent;
  totalSetup: number;
  totalRecurring: number;
  agency: AgencySettings | null;
  recipient: {
    name: string;
    company?: string | null;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  issuedDate: Date;
  validUntil: Date;
  signature?: ProposalSignature | null;
}

const COLOR = {
  primary: "#1d4ed8",
  primaryLight: "#eff6ff",
  border: "#cbd5e1",
  text: "#0f172a",
  muted: "#64748b",
  total: "#1d4ed8",
};

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: COLOR.text,
    lineHeight: 1.4,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLOR.primary,
    paddingBottom: 4,
    marginBottom: 18,
  },
  topBarLeft: { color: COLOR.muted, fontSize: 9 },
  topBarRight: { color: COLOR.primary, fontWeight: 700, fontSize: 9 },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: COLOR.primary,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: COLOR.muted,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 18,
  },
  twoCol: { flexDirection: "row", gap: 12, marginBottom: 18 },
  partyBox: {
    flex: 1,
    backgroundColor: COLOR.primaryLight,
    padding: 10,
    borderRadius: 4,
  },
  partyLabel: { color: COLOR.primary, fontWeight: 700, fontSize: 10, marginBottom: 2 },
  partyName: { fontWeight: 700, fontSize: 11, marginBottom: 2 },
  partyLine: { fontSize: 9, color: COLOR.text, marginBottom: 1 },
  partyMeta: { fontSize: 9, color: COLOR.text, marginTop: 4 },
  partyMetaLabel: { fontWeight: 700 },

  sectionHeader: {
    backgroundColor: COLOR.primary,
    color: "#ffffff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontWeight: 700,
    fontSize: 10.5,
    marginTop: 10,
    marginBottom: 8,
  },
  p: { marginBottom: 6, textAlign: "justify" },

  table: { borderWidth: 1, borderColor: COLOR.border, marginBottom: 6 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLOR.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
  },
  th: {
    padding: 5,
    fontWeight: 700,
    color: COLOR.primary,
    fontSize: 9.5,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
  },
  trLast: { flexDirection: "row" },
  td: { padding: 5, fontSize: 9 },
  subTotalRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
  },
  subTotalCell: { padding: 5, fontWeight: 700, fontSize: 9.5 },
  groupHeader: {
    flexDirection: "row",
    backgroundColor: "#e0e7ff",
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
  },
  groupHeaderCell: {
    padding: 5,
    fontWeight: 700,
    color: COLOR.primary,
    fontSize: 9.5,
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: COLOR.total,
  },
  totalCell: { padding: 6, fontWeight: 700, color: "#ffffff", fontSize: 10.5 },
  noteRow: { padding: 4, fontSize: 8, color: COLOR.muted, fontStyle: "italic" },

  colDesignation: { width: "55%" },
  colFreq: { width: "15%", textAlign: "center" as const },
  colPu: { width: "15%", textAlign: "right" as const },
  colTotal: { width: "15%", textAlign: "right" as const },

  // Deliverables table
  delService: { width: "20%" },
  delItems: { width: "55%" },
  delFreq: { width: "25%", fontStyle: "italic" as const, color: COLOR.muted },

  // Conditions
  h3: { fontSize: 10, fontWeight: 700, color: COLOR.primary, marginTop: 10, marginBottom: 4 },
  bullet: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 8,
  },
  bulletDot: { width: 10 },

  // Legal table
  legalTable: { borderWidth: 1, borderColor: COLOR.border, marginBottom: 8 },
  legalRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
  },
  legalRowLast: { flexDirection: "row" },
  legalKey: {
    width: "30%",
    padding: 6,
    backgroundColor: COLOR.primaryLight,
    fontWeight: 700,
    color: COLOR.primary,
    fontSize: 9.5,
  },
  legalVal: { width: "70%", padding: 6, fontSize: 9 },

  // Signature
  signatureCallout: {
    backgroundColor: COLOR.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: COLOR.primary,
    padding: 8,
    marginTop: 6,
    marginBottom: 14,
    textAlign: "center" as const,
    fontWeight: 700,
    fontStyle: "italic" as const,
    color: COLOR.primary,
  },
  signatureGrid: { flexDirection: "row", gap: 12 },
  signatureCol: { flex: 1, padding: 10, borderWidth: 1, borderColor: COLOR.border },
  signatureLabel: { fontWeight: 700, marginBottom: 6 },
  signatureLine: { marginTop: 4, fontSize: 9 },
  signatureMeta: { marginTop: 6, fontSize: 8, color: COLOR.muted, fontStyle: "italic" as const },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
    paddingTop: 6,
    fontSize: 8,
    color: COLOR.muted,
    textAlign: "center" as const,
  },
});

function euro(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR").format(date);
}

function ProposalDoc({ input }: { input: ProposalPdfInput }) {
  const {
    number,
    content,
    totalSetup,
    totalRecurring,
    agency,
    recipient,
    issuedDate,
    validUntil,
    signature,
  } = input;
  const lineItems = content.lineItems ?? [];
  const setupItems = lineItems.filter((i) => i.group === "setup");
  const recurringItems = lineItems.filter((i) => i.group === "recurring");
  const grandTotal = totalSetup + totalRecurring;

  const ribbonLeft = `${agency?.tradingName ?? agency?.legalName ?? "Devis"} · ${number}`;
  const vatNotice = agency?.vatRegime ?? "TVA non applicable — Art. 293 B du CGI";

  return (
    <Document>
      <Page size="A4" style={s.page} wrap>
        {/* Top bar */}
        <View style={s.topBar} fixed>
          <Text style={s.topBarLeft}>{ribbonLeft}</Text>
          <Text style={s.topBarRight}>{number}</Text>
        </View>

        <Text style={s.title}>DEVIS DE PRESTATION DE SERVICES</Text>
        {content.subtitle && <Text style={s.subtitle}>{content.subtitle}</Text>}

        {/* Prestataire + Client */}
        <View style={s.twoCol}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>PRESTATAIRE</Text>
            <Text style={s.partyName}>{agency?.legalName ?? "—"}</Text>
            {agency?.legalStatus && <Text style={s.partyLine}>{agency.legalStatus}</Text>}
            {agency?.siret && <Text style={s.partyLine}>SIRET : {agency.siret}</Text>}
            {agency?.apeCode && <Text style={s.partyLine}>Code APE : {agency.apeCode}</Text>}
            {agency?.address && (
              <Text style={s.partyLine}>
                {agency.address}
                {agency.postalCode || agency.city
                  ? `, ${[agency.postalCode, agency.city].filter(Boolean).join(" ")}`
                  : ""}
              </Text>
            )}
            {(agency?.email || agency?.phone) && (
              <Text style={s.partyLine}>
                {[agency?.email, agency?.phone].filter(Boolean).join(" / ")}
              </Text>
            )}
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>CLIENT</Text>
            <Text style={s.partyName}>{recipient.company || recipient.name}</Text>
            {recipient.company && recipient.name !== recipient.company && (
              <Text style={s.partyLine}>{recipient.name}</Text>
            )}
            {recipient.address && <Text style={s.partyLine}>{recipient.address}</Text>}
            {(recipient.email || recipient.phone) && (
              <Text style={s.partyLine}>
                {[recipient.email, recipient.phone].filter(Boolean).join(" · ")}
              </Text>
            )}
            <Text style={s.partyMeta}>
              <Text style={s.partyMetaLabel}>N° Devis : </Text>
              {number}
            </Text>
            <Text style={s.partyMeta}>
              <Text style={s.partyMetaLabel}>Date : </Text>
              {formatDate(issuedDate)}
            </Text>
            <Text style={s.partyMeta}>
              <Text style={s.partyMetaLabel}>Valide jusqu&apos;au : </Text>
              {formatDate(validUntil)}
            </Text>
          </View>
        </View>

        {/* 1. Objet */}
        {content.objectDescription && (
          <>
            <Text style={s.sectionHeader}>1. OBJET DU DEVIS</Text>
            <Text style={s.p}>{content.objectDescription}</Text>
          </>
        )}

        {/* 2. Récapitulatif financier */}
        <Text style={s.sectionHeader}>2. RÉCAPITULATIF FINANCIER</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.th, s.colDesignation]}>Désignation / Prestation</Text>
            <Text style={[s.th, s.colFreq]}>Fréquence</Text>
            <Text style={[s.th, s.colPu]}>P.U. HT</Text>
            <Text style={[s.th, s.colTotal]}>Total HT</Text>
          </View>

          {setupItems.length > 0 && (
            <>
              <View style={s.groupHeader}>
                <Text style={s.groupHeaderCell}>FRAIS DE MISE EN SERVICE (une fois unique)</Text>
              </View>
              {setupItems.map((it, idx) => (
                <View key={`s-${idx}`} style={s.tr}>
                  <Text style={[s.td, s.colDesignation]}>{it.label}</Text>
                  <Text style={[s.td, s.colFreq]}>{it.frequency}</Text>
                  <Text style={[s.td, s.colPu]}>{euro(it.unitPrice)}</Text>
                  <Text style={[s.td, s.colTotal]}>{euro(it.unitPrice)}</Text>
                </View>
              ))}
              <View style={s.subTotalRow}>
                <Text style={[s.subTotalCell, { width: "85%" }]}>Sous-total mise en service</Text>
                <Text style={[s.subTotalCell, s.colTotal]}>{euro(totalSetup)}</Text>
              </View>
            </>
          )}

          {recurringItems.length > 0 && (
            <>
              <View style={s.groupHeader}>
                <Text style={s.groupHeaderCell}>ABONNEMENT MENSUEL RÉCURRENT</Text>
              </View>
              {recurringItems.map((it, idx) => (
                <View key={`r-${idx}`} style={s.tr}>
                  <Text style={[s.td, s.colDesignation]}>{it.label}</Text>
                  <Text style={[s.td, s.colFreq]}>{it.frequency}</Text>
                  <Text style={[s.td, s.colPu]}>{euro(it.unitPrice)}</Text>
                  <Text style={[s.td, s.colTotal]}>{euro(it.unitPrice)}</Text>
                </View>
              ))}
              <View style={s.subTotalRow}>
                <Text style={[s.subTotalCell, { width: "85%" }]}>Sous-total abonnement mensuel</Text>
                <Text style={[s.subTotalCell, s.colTotal]}>{euro(totalRecurring)}</Text>
              </View>
            </>
          )}

          <View style={s.totalRow}>
            <Text style={[s.totalCell, { width: "85%" }]}>
              TOTAL 1ÈRE ÉCHÉANCE (Mise en place + 1er mois)
            </Text>
            <Text style={[s.totalCell, s.colTotal]}>{euro(grandTotal)}</Text>
          </View>
          <View style={s.trLast}>
            <Text style={s.noteRow}>{vatNotice}</Text>
          </View>
        </View>

        {/* 3. Livrables */}
        {content.deliverables && content.deliverables.length > 0 && (
          <View wrap={false}>
            <Text style={s.sectionHeader}>3. LIVRABLES DÉTAILLÉS</Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.th, s.delService]}>Service</Text>
                <Text style={[s.th, s.delItems]}>Livrables inclus</Text>
                <Text style={[s.th, s.delFreq]}>Fréquence</Text>
              </View>
              {content.deliverables.map((d, idx) => (
                <View
                  key={`d-${idx}`}
                  style={idx === content.deliverables!.length - 1 ? s.trLast : s.tr}
                >
                  <Text style={[s.td, s.delService, { color: COLOR.primary, fontWeight: 700 }]}>
                    {d.service}
                  </Text>
                  <View style={[s.delItems, { padding: 5 }]}>
                    {d.items.map((it, i) => (
                      <Text key={i} style={{ fontSize: 9, marginBottom: 1 }}>
                        • {it}
                      </Text>
                    ))}
                  </View>
                  <Text style={[s.td, s.delFreq]}>{d.frequency}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 4. Conditions */}
        <Text style={s.sectionHeader}>4. CONDITIONS DE L&apos;ABONNEMENT</Text>
        {content.conditionsEngagement && (
          <View>
            <Text style={s.h3}>4.1 Durée d&apos;engagement</Text>
            <Text style={s.p}>{content.conditionsEngagement}</Text>
          </View>
        )}
        {content.conditionsBilling && (
          <View>
            <Text style={s.h3}>4.2 Facturation & paiement</Text>
            <Text style={s.p}>{content.conditionsBilling}</Text>
          </View>
        )}
        {content.conditionsPriceRevision && (
          <View>
            <Text style={s.h3}>4.3 Révision tarifaire</Text>
            <Text style={s.p}>{content.conditionsPriceRevision}</Text>
          </View>
        )}
        {content.conditionsClientObligations && (
          <View>
            <Text style={s.h3}>4.4 Obligations du client</Text>
            <Text style={s.p}>{content.conditionsClientObligations}</Text>
          </View>
        )}

        {/* 5+. Sections additionnelles */}
        {content.additionalSections?.map((sec, idx) => (
          <View key={`add-${idx}`}>
            <Text style={s.sectionHeader}>{`${5 + idx}. ${sec.title.toUpperCase()}`}</Text>
            <Text style={s.p}>{sec.body}</Text>
          </View>
        ))}

        {/* Mentions légales (globales) */}
        {agency && (
          <View>
            <Text style={s.sectionHeader}>
              {`${5 + (content.additionalSections?.length ?? 0)}. MENTIONS LÉGALES`}
            </Text>
            <View style={s.legalTable}>
              {agency.legalStatus && (
                <View style={s.legalRow}>
                  <Text style={s.legalKey}>Statut juridique</Text>
                  <Text style={s.legalVal}>{agency.legalStatus}</Text>
                </View>
              )}
              {agency.siret && (
                <View style={s.legalRow}>
                  <Text style={s.legalKey}>SIRET</Text>
                  <Text style={s.legalVal}>{agency.siret}</Text>
                </View>
              )}
              {agency.apeCode && (
                <View style={s.legalRow}>
                  <Text style={s.legalKey}>Code APE / NAF</Text>
                  <Text style={s.legalVal}>{agency.apeCode}</Text>
                </View>
              )}
              {agency.vatRegime && (
                <View style={s.legalRow}>
                  <Text style={s.legalKey}>Régime TVA</Text>
                  <Text style={s.legalVal}>{agency.vatRegime}</Text>
                </View>
              )}
              <View style={s.legalRow}>
                <Text style={s.legalKey}>Loi applicable</Text>
                <Text style={s.legalVal}>Droit français</Text>
              </View>
              {agency.jurisdiction && (
                <View style={s.legalRow}>
                  <Text style={s.legalKey}>Juridiction compétente</Text>
                  <Text style={s.legalVal}>{agency.jurisdiction}</Text>
                </View>
              )}
              <View style={s.legalRowLast}>
                <Text style={s.legalKey}>Droit de rétractation</Text>
                <Text style={s.legalVal}>
                  Conformément à l&apos;art. L.221-18 du Code de la consommation, le client
                  professionnel ne bénéficie pas du droit de rétractation de 14 jours.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Signature */}
        <View wrap={false}>
          <Text style={s.sectionHeader}>
            {`${5 + (content.additionalSections?.length ?? 0) + (agency ? 1 : 0)}. VALIDATION & SIGNATURE`}
          </Text>
          <Text style={s.p}>
            Pour acceptation du présent devis, le client est invité à signer électroniquement,
            précédé de la mention :
          </Text>
          <Text style={s.signatureCallout}>« Bon pour accord — Lu et approuvé »</Text>
          <View style={s.signatureGrid}>
            <View style={s.signatureCol}>
              <Text style={s.signatureLabel}>Le prestataire</Text>
              <Text style={s.signatureLine}>{agency?.legalName ?? "—"}</Text>
              <Text style={s.signatureLine}>Le {formatDateShort(issuedDate)}</Text>
              <Text style={s.signatureMeta}>Signature et date</Text>
            </View>
            <View style={s.signatureCol}>
              <Text style={s.signatureLabel}>Le client</Text>
              {signature ? (
                <>
                  <Text style={s.signatureLine}>{signature.name}</Text>
                  <Text style={s.signatureLine}>
                    Le {formatDateShort(signature.signedAt)}
                  </Text>
                  <Text style={s.signatureMeta}>
                    Signature électronique
                    {signature.ip ? ` — IP ${signature.ip}` : ""}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.signatureLine}>
                    {recipient.company || recipient.name}
                  </Text>
                  <Text style={s.signatureMeta}>
                    Signature, date et cachet le cas échéant
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text
          style={s.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${ribbonLeft} · ${vatNotice} · Page ${pageNumber} / ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export async function renderProposalPdf(input: ProposalPdfInput): Promise<Buffer> {
  return renderToBuffer(<ProposalDoc input={input} />);
}
