import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

const brand = "#EC4899";

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#fafafa",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          margin: 0,
          padding: "32px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            maxWidth: 520,
            margin: "0 auto",
            padding: 32,
          }}
        >
          <Section>
            <Text style={{ color: brand, fontSize: 18, fontWeight: 700, margin: 0 }}>PINKEVO</Text>
          </Section>
          <Hr style={{ borderColor: "#eee", margin: "16px 0 24px" }} />
          {children}
          <Hr style={{ borderColor: "#eee", margin: "28px 0 16px" }} />
          <Text style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
            PINKEVO OS — Le cockpit central de l&apos;agence.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const btn = {
  backgroundColor: brand,
  borderRadius: 8,
  color: "#fff",
  display: "inline-block",
  fontSize: 14,
  fontWeight: 600,
  padding: "12px 22px",
  textDecoration: "none",
};

export const para = { color: "#0f172a", fontSize: 15, lineHeight: "24px" };
