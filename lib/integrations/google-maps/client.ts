export interface PlaceResult {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  mock?: boolean;
}

/**
 * Google Places text search. Without GOOGLE_MAPS_API_KEY we synthesize
 * plausible local businesses so the prospector agent stays demoable.
 */
export async function searchPlaces(
  keyword: string,
  city: string,
  limit: number,
): Promise<PlaceResult[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      name: `${keyword} ${city} #${i + 1}`,
      address: `${10 + i} rue de l'Exemple, ${city}`,
      phone: `+33 1 23 45 67 ${String(10 + i).padStart(2, "0")}`,
      website: `https://www.${keyword.toLowerCase().replace(/\s+/g, "-")}-${i + 1}.fr`,
      mock: true,
    }));
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri",
    },
    body: JSON.stringify({ textQuery: `${keyword} ${city}`, maxResultCount: limit }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    places?: Array<{
      displayName?: { text?: string };
      formattedAddress?: string;
      nationalPhoneNumber?: string;
      websiteUri?: string;
    }>;
  };
  return (data.places ?? []).map((p) => ({
    name: p.displayName?.text ?? "Inconnu",
    address: p.formattedAddress,
    phone: p.nationalPhoneNumber,
    website: p.websiteUri,
  }));
}
