/**
 * Pappers API — French company enrichment (SIREN, revenue, headcount).
 * Docs: https://www.pappers.fr/api
 *
 * If PAPPERS_API_KEY is unset we return a deterministic mock so the UI/flow
 * remains testable without credentials (clearly flagged via `mock: true`).
 */

export interface PappersCompany {
  siren?: string;
  name?: string;
  revenue?: number | null;
  headcount?: number | null;
  naf?: string | null;
  city?: string | null;
  mock?: boolean;
  raw?: unknown;
}

export async function searchCompany(query: string): Promise<PappersCompany | null> {
  const key = process.env.PAPPERS_API_KEY;
  if (!key) {
    return {
      name: query,
      siren: "000000000",
      revenue: 480_000,
      headcount: 8,
      naf: "62.01Z",
      city: "Paris",
      mock: true,
    };
  }

  const url = new URL("https://api.pappers.fr/v2/recherche");
  url.searchParams.set("api_token", key);
  url.searchParams.set("q", query);
  url.searchParams.set("par_page", "1");

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    resultats?: Array<{
      siren?: string;
      nom_entreprise?: string;
      chiffre_affaires?: number;
      effectif?: number;
      code_naf?: string;
      siege?: { ville?: string };
    }>;
  };
  const hit = data.resultats?.[0];
  if (!hit) return null;
  return {
    siren: hit.siren,
    name: hit.nom_entreprise,
    revenue: hit.chiffre_affaires ?? null,
    headcount: hit.effectif ?? null,
    naf: hit.code_naf ?? null,
    city: hit.siege?.ville ?? null,
    raw: hit,
  };
}
