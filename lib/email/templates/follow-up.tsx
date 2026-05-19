import { Body, Container, Head, Html, Link, Preview, Text } from "@react-email/components";

const s = {
  body: {
    backgroundColor: "#ffffff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  container: { maxWidth: 560, margin: "0 auto", padding: "0 24px" },
  greeting: { color: "#0f172a", fontSize: 15, lineHeight: "24px", margin: "0 0 16px" },
  text: { color: "#0f172a", fontSize: 15, lineHeight: "24px", margin: "0 0 12px" },
  signature: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: "20px",
    margin: "24px 0 0",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "16px",
  },
  link: { color: "#EC4899" },
};

function parseSegments(
  text: string,
): Array<{ type: "text" | "link"; content: string; href?: string }> {
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const segments: Array<{ type: "text" | "link"; content: string; href?: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: "text", content: text.slice(last, m.index) });
    segments.push({ type: "link", content: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: "text", content: text.slice(last) });
  return segments.length ? segments : [{ type: "text", content: text }];
}

export interface FollowUpEmailProps {
  contactName: string;
  message: string;
}

export function FollowUpEmail({ contactName, message }: FollowUpEmailProps) {
  const lines = message.split("\n").filter((l) => l.trim() !== "");

  return (
    <Html>
      <Head />
      <Preview>On reprend contact</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Text style={s.greeting}>Bonjour {contactName},</Text>

          {lines.map((line, i) => {
            const segments = parseSegments(line);
            return (
              <Text key={i} style={s.text}>
                {segments.map((seg, j) =>
                  seg.type === "link" ? (
                    <Link key={j} href={seg.href} style={s.link}>
                      {seg.content}
                    </Link>
                  ) : (
                    seg.content
                  ),
                )}
              </Text>
            );
          })}

          <Text style={s.text}>Cordialement,</Text>
          <Text style={s.signature}>L&apos;équipe Agence PINKEVO</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default FollowUpEmail;
