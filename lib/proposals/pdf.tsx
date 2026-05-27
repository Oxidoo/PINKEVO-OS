import { Document, Link, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";

export interface ProposalContent {
  title?: string;
  context?: string;
  objectives?: string[];
  deliverables?: string[];
  timeline?: string;
  conditions?: string;
  totalSetup?: number;
  totalRecurring?: number;
  paymentLink?: { url: string; label: string } | null;
  signature?: {
    name: string;
    signedAt: Date | string;
    ip?: string | null;
  } | null;
}

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#0f172a" },
  brand: { fontSize: 16, fontWeight: 700, color: "#EC4899", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 700, marginTop: 16, marginBottom: 16 },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 6 },
  p: { lineHeight: 1.5, marginBottom: 4 },
  li: { marginBottom: 3, paddingLeft: 10 },
  priceBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#fdf2f8",
    borderRadius: 6,
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  total: { fontSize: 14, fontWeight: 700 },
  payBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 6,
    borderStyle: "solid",
    borderColor: "#EC4899",
    borderWidth: 1,
  },
  payLink: { color: "#EC4899", marginTop: 4, textDecoration: "underline" },
  signedBox: {
    marginTop: 18,
    padding: 14,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    borderColor: "#bbf7d0",
    borderStyle: "solid",
    borderWidth: 1,
  },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 9, color: "#94a3b8" },
});

function formatDateFr(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ProposalDoc({ content }: { content: ProposalContent }) {
  const euro = (n?: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n ?? 0);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>PINKEVO</Text>
        <Text style={s.title}>{content.title ?? "Proposition commerciale"}</Text>

        {content.context && (
          <View>
            <Text style={s.h2}>Contexte</Text>
            <Text style={s.p}>{content.context}</Text>
          </View>
        )}

        {content.objectives && content.objectives.length > 0 && (
          <View>
            <Text style={s.h2}>Objectifs</Text>
            {content.objectives.map((o) => (
              <Text key={`o-${o}`} style={s.li}>
                • {o}
              </Text>
            ))}
          </View>
        )}

        {content.deliverables && content.deliverables.length > 0 && (
          <View>
            <Text style={s.h2}>Livrables</Text>
            {content.deliverables.map((d) => (
              <Text key={`d-${d}`} style={s.li}>
                • {d}
              </Text>
            ))}
          </View>
        )}

        {content.timeline && (
          <View>
            <Text style={s.h2}>Planning</Text>
            <Text style={s.p}>{content.timeline}</Text>
          </View>
        )}

        <View style={s.priceBox}>
          <View style={s.priceRow}>
            <Text>Frais de mise en place</Text>
            <Text>{euro(content.totalSetup)}</Text>
          </View>
          <View style={s.priceRow}>
            <Text>Abonnement mensuel</Text>
            <Text>{euro(content.totalRecurring)}</Text>
          </View>
          <View style={[s.priceRow, { marginTop: 8 }]}>
            <Text style={s.total}>Total à l&apos;engagement</Text>
            <Text style={s.total}>{euro(content.totalSetup)}</Text>
          </View>
        </View>

        {content.paymentLink && (
          <View style={s.payBox}>
            <Text style={{ fontSize: 12, fontWeight: 700 }}>Paiement sécurisé</Text>
            <Text style={s.p}>
              Réglez en ligne en quelques secondes : {content.paymentLink.label}
            </Text>
            <Link src={content.paymentLink.url} style={s.payLink}>
              {content.paymentLink.url}
            </Link>
          </View>
        )}

        {content.conditions && (
          <View>
            <Text style={s.h2}>Conditions</Text>
            <Text style={s.p}>{content.conditions}</Text>
          </View>
        )}

        {content.signature ? (
          <View style={s.signedBox}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>
              Devis signé électroniquement
            </Text>
            <Text style={s.p}>Par : {content.signature.name}</Text>
            <Text style={s.p}>Le : {formatDateFr(content.signature.signedAt)}</Text>
            {content.signature.ip && (
              <Text style={[s.p, { color: "#64748b", fontSize: 9 }]}>
                Adresse IP : {content.signature.ip}
              </Text>
            )}
          </View>
        ) : null}

        <Text style={s.footer}>
          PINKEVO — Devis généré par PINKEVO OS. Valeur juridique d&apos;une signature
          électronique simple (eIDAS).
        </Text>
      </Page>
    </Document>
  );
}

export async function renderProposalPdf(content: ProposalContent): Promise<Buffer> {
  return renderToBuffer(<ProposalDoc content={content} />);
}
