import "server-only";

export type CheckStatus = "pass" | "warn" | "fail";

export interface OnPageCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface OnPageScanResult {
  url: string;
  fetchedAt: string;
  /** Aggregate score 0–100 derived from pass/warn/fail counts. */
  score: number;
  responseTimeMs: number;
  httpStatus: number | null;
  isHttps: boolean;
  checks: OnPageCheck[];
  /** Set when the page fetch itself failed (DNS, timeout, blocked). */
  error?: string;
}

const TITLE_MIN = 25;
const TITLE_MAX = 65;
const DESC_MIN = 70;
const DESC_MAX = 165;

export async function scanOnPage(url: string): Promise<OnPageScanResult> {
  const start = Date.now();
  let html = "";
  let httpStatus: number | null = null;
  let headers: Headers | null = null;
  let isHttps = false;
  try {
    const parsed = new URL(url);
    isHttps = parsed.protocol === "https:";
  } catch {
    return errorResult(url, start, "URL invalide");
  }

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "PINKEVO-OS Bot/1.0 (+https://pinkevo.app)" },
    });
    httpStatus = res.status;
    headers = res.headers;
    if (res.ok) html = await res.text();
  } catch (err) {
    return errorResult(url, start, err instanceof Error ? err.message : "Échec de récupération");
  }

  const checks: OnPageCheck[] = [];

  checks.push({
    id: "https",
    label: "HTTPS",
    status: isHttps ? "pass" : "fail",
    detail: isHttps ? "Le site est servi en HTTPS." : "Le site n'est pas en HTTPS.",
  });

  if (!html) {
    return {
      url,
      fetchedAt: new Date().toISOString(),
      score: 0,
      responseTimeMs: Date.now() - start,
      httpStatus,
      isHttps,
      checks: [
        ...checks,
        {
          id: "fetch",
          label: "Page accessible",
          status: "fail",
          detail: `La page a renvoyé un statut ${httpStatus ?? "inconnu"}.`,
        },
      ],
      error: `HTTP ${httpStatus}`,
    };
  }

  // Title
  const title = extract(html, /<title[^>]*>([^<]*)<\/title>/i)?.trim();
  checks.push(titleCheck(title));

  // Meta description
  const description = extractAttr(html, "meta", "name", "description", "content");
  checks.push(descriptionCheck(description));

  // H1
  const h1Count = (html.match(/<h1\b[^>]*>/gi) ?? []).length;
  checks.push({
    id: "h1",
    label: "Balise H1",
    status: h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warn",
    detail:
      h1Count === 1
        ? "Exactement une balise H1, parfait."
        : h1Count === 0
          ? "Aucune balise H1 trouvée."
          : `${h1Count} balises H1 détectées (idéal : 1).`,
  });

  // Canonical
  const canonical = extractAttr(html, "link", "rel", "canonical", "href");
  checks.push({
    id: "canonical",
    label: "URL canonique",
    status: canonical ? "pass" : "warn",
    detail: canonical
      ? `Canonical défini : ${canonical}`
      : 'Aucune balise <link rel="canonical"> trouvée.',
  });

  // Lang
  const lang = extract(html, /<html[^>]*\blang=["']([^"']+)["']/i);
  checks.push({
    id: "lang",
    label: "Attribut lang",
    status: lang ? "pass" : "warn",
    detail: lang ? `Langue déclarée : ${lang}` : "Aucun attribut lang sur <html>.",
  });

  // Open Graph
  const ogTitle = extractAttr(html, "meta", "property", "og:title", "content");
  const ogImage = extractAttr(html, "meta", "property", "og:image", "content");
  const ogDesc = extractAttr(html, "meta", "property", "og:description", "content");
  const ogCount = [ogTitle, ogImage, ogDesc].filter(Boolean).length;
  checks.push({
    id: "og",
    label: "Open Graph",
    status: ogCount === 3 ? "pass" : ogCount > 0 ? "warn" : "fail",
    detail:
      ogCount === 3
        ? "og:title, og:description et og:image présents."
        : ogCount === 0
          ? "Aucune balise Open Graph (titre/desc/image)."
          : `${ogCount} balise(s) Open Graph sur 3.`,
  });

  // Viewport
  const viewport = extractAttr(html, "meta", "name", "viewport", "content");
  checks.push({
    id: "viewport",
    label: "Viewport mobile",
    status: viewport ? "pass" : "fail",
    detail: viewport
      ? `<meta name="viewport" content="${viewport}">`
      : "Aucune balise viewport — le site ne s'adapte pas correctement au mobile.",
  });

  // Robots meta
  const robotsMeta = extractAttr(html, "meta", "name", "robots", "content");
  const blocked = robotsMeta && /noindex|none/i.test(robotsMeta);
  checks.push({
    id: "robots-meta",
    label: "Indexation autorisée",
    status: blocked ? "fail" : "pass",
    detail: blocked
      ? `<meta name="robots" content="${robotsMeta}"> bloque l'indexation.`
      : robotsMeta
        ? `<meta name="robots" content="${robotsMeta}">`
        : "Pas de meta robots restrictive, indexation autorisée par défaut.",
  });

  // Server header (info only)
  const server = headers?.get("server");
  if (server) {
    checks.push({
      id: "server",
      label: "Serveur",
      status: "pass",
      detail: `Header Server : ${server}`,
    });
  }

  // robots.txt + sitemap
  const origin = new URL(url).origin;
  const [robots, sitemap] = await Promise.all([
    headExists(`${origin}/robots.txt`),
    headExists(`${origin}/sitemap.xml`),
  ]);
  checks.push({
    id: "robots-txt",
    label: "robots.txt",
    status: robots ? "pass" : "warn",
    detail: robots ? `${origin}/robots.txt accessible.` : `${origin}/robots.txt introuvable.`,
  });
  checks.push({
    id: "sitemap",
    label: "sitemap.xml",
    status: sitemap ? "pass" : "warn",
    detail: sitemap ? `${origin}/sitemap.xml accessible.` : `${origin}/sitemap.xml introuvable.`,
  });

  const score = computeScore(checks);

  return {
    url,
    fetchedAt: new Date().toISOString(),
    score,
    responseTimeMs: Date.now() - start,
    httpStatus,
    isHttps,
    checks,
  };
}

function titleCheck(title: string | undefined): OnPageCheck {
  if (!title) {
    return {
      id: "title",
      label: "Balise <title>",
      status: "fail",
      detail: "Aucune balise <title> trouvée.",
    };
  }
  const len = title.length;
  if (len < TITLE_MIN) {
    return {
      id: "title",
      label: "Balise <title>",
      status: "warn",
      detail: `${len} caractères (recommandé : ${TITLE_MIN}–${TITLE_MAX}). Titre : "${title}"`,
    };
  }
  if (len > TITLE_MAX) {
    return {
      id: "title",
      label: "Balise <title>",
      status: "warn",
      detail: `${len} caractères (trop long, recommandé : ${TITLE_MIN}–${TITLE_MAX}). Titre : "${title}"`,
    };
  }
  return {
    id: "title",
    label: "Balise <title>",
    status: "pass",
    detail: `"${title}" (${len} car.)`,
  };
}

function descriptionCheck(desc: string | null): OnPageCheck {
  if (!desc) {
    return {
      id: "description",
      label: "Meta description",
      status: "fail",
      detail: "Pas de meta description.",
    };
  }
  const len = desc.length;
  if (len < DESC_MIN) {
    return {
      id: "description",
      label: "Meta description",
      status: "warn",
      detail: `${len} caractères (recommandé : ${DESC_MIN}–${DESC_MAX}).`,
    };
  }
  if (len > DESC_MAX) {
    return {
      id: "description",
      label: "Meta description",
      status: "warn",
      detail: `${len} caractères (trop long, recommandé : ${DESC_MIN}–${DESC_MAX}).`,
    };
  }
  return {
    id: "description",
    label: "Meta description",
    status: "pass",
    detail: `${len} caractères, bonne longueur.`,
  };
}

function extract(html: string, regex: RegExp): string | undefined {
  return html.match(regex)?.[1];
}

function extractAttr(
  html: string,
  tag: string,
  matchAttr: string,
  matchValue: string,
  targetAttr: string,
): string | null {
  const escaped = matchValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${tag}\\b[^>]*\\b${matchAttr}=["']${escaped}["'][^>]*>`, "i");
  const tagMatch = html.match(re);
  if (!tagMatch) return null;
  const attrRe = new RegExp(`\\b${targetAttr}=["']([^"']*)["']`, "i");
  return tagMatch[0].match(attrRe)?.[1] ?? null;
}

async function headExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5_000),
      headers: { "user-agent": "PINKEVO-OS Bot/1.0" },
    });
    if (res.ok) return true;
    if (res.status === 405) {
      const get = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(5_000),
      });
      return get.ok;
    }
    return false;
  } catch {
    return false;
  }
}

function computeScore(checks: OnPageCheck[]): number {
  if (checks.length === 0) return 0;
  const total = checks.reduce((sum, c) => {
    if (c.status === "pass") return sum + 1;
    if (c.status === "warn") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((total / checks.length) * 100);
}

function errorResult(url: string, startedAt: number, message: string): OnPageScanResult {
  return {
    url,
    fetchedAt: new Date().toISOString(),
    score: 0,
    responseTimeMs: Date.now() - startedAt,
    httpStatus: null,
    isHttps: false,
    checks: [],
    error: message,
  };
}
