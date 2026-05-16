import { Document, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";

export interface ProposalContent {
  title?: string;
  context?: string;
  objectives?: string[];
  deliverables?: string[];
  timeline?: string;
  totalSetup?: number;
  totalRecurring?: number;
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
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 9, color: "#94a3b8" },
});

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

        <Text style={s.footer}>
          PINKEVO — Proposition générée automatiquement. Valable 30 jours.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderProposalPdf(content: ProposalContent): Promise<Buffer> {
  return renderToBuffer(<ProposalDoc content={content} />);
}
