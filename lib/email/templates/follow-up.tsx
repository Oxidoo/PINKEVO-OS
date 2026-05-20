import { Body, Container, Head, Html, Link, Text } from "@react-email/components";
import type { CSSProperties } from "react";

const s = {
  body: {
    backgroundColor: "#ffffff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  container: { maxWidth: 560, margin: "0 auto", padding: "0 24px" },
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

function parseStyleBlock(raw: string | undefined): CSSProperties {
  if (!raw) return {};
  const style: CSSProperties = {};
  for (const part of raw.split(";")) {
    const [k, v] = part.split(":").map((s) => s.trim());
    if (!k || !v) continue;
    if (k === "color") style.color = v;
    else if (k === "size") style.fontSize = `${v}px`;
    else if (k === "font") style.fontFamily = v;
    else if (k === "bold" && v === "1") style.fontWeight = 700;
  }
  return style;
}

function parseSegments(
  text: string,
): Array<{ type: "text" | "link"; content: string; href?: string; style?: CSSProperties }> {
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)(?:\{([^}]*)\})?/g;
  const segments: Array<{ type: "text" | "link"; content: string; href?: string; style?: CSSProperties }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: "text", content: text.slice(last, m.index) });
    segments.push({
      type: "link",
      content: m[1] ?? "",
      href: m[2] ?? "",
      style: parseStyleBlock(m[3]),
    });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: "text", content: text.slice(last) });
  return segments.length ? segments : [{ type: "text", content: text }];
}

export interface FollowUpEmailProps {
  message: string;
  signature?: string;
}

export function FollowUpEmail({ message, signature }: FollowUpEmailProps) {
  const lines = message.split("\n").filter((l) => l.trim() !== "");
  const sigLines = (signature ?? "L'équipe Agence PINKEVO")
    .split("\n")
    .filter((l) => l.trim() !== "");

  return (
    <Html>
      <Head />
      <Body style={s.body}>
        <Container style={s.container}>
          {lines.map((line, i) => {
            const segments = parseSegments(line);
            return (
              <Text key={i} style={s.text}>
                {segments.map((seg, j) =>
                  seg.type === "link" ? (
                    <Link key={j} href={seg.href} style={{ ...s.link, ...seg.style }}>
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
          <Text style={s.signature}>
            {sigLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < sigLines.length - 1 && <br />}
              </span>
            ))}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default FollowUpEmail;
