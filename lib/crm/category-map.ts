/**
 * Maps a raw Google/Bing Maps category (FR or EN) to PINKEVO's taxonomy.
 * Keyword-based — returns null when nothing matches so the caller can fall
 * back to a manual default. Keep keys lowercase & accent-free.
 */

interface Mapped {
  category: string;
  sector: string;
}

// Each entry: keyword(s) found in the raw category → our { category, sector }.
const RULES: { keywords: string[]; result: Mapped }[] = [
  // BTP
  { keywords: ["plumber", "plombier"], result: { category: "BTP", sector: "Plombier" } },
  {
    keywords: ["electrician", "electricien", "électricien"],
    result: { category: "BTP", sector: "Électricien" },
  },
  { keywords: ["roofer", "couvreur", "roofing"], result: { category: "BTP", sector: "Couvreur" } },
  {
    keywords: ["mason", "macon", "maçon", "masonry"],
    result: { category: "BTP", sector: "Maçon" },
  },
  { keywords: ["painter", "peintre", "painting"], result: { category: "BTP", sector: "Peintre" } },
  {
    keywords: ["carpenter", "menuisier", "menuiserie"],
    result: { category: "BTP", sector: "Menuisier" },
  },
  { keywords: ["tiler", "carreleur"], result: { category: "BTP", sector: "Carreleur" } },
  {
    keywords: ["hvac", "chauffagiste", "heating"],
    result: { category: "BTP", sector: "Chauffagiste" },
  },
  {
    keywords: ["air conditioning", "climatisation", "climaticien"],
    result: { category: "BTP", sector: "Climaticien" },
  },
  { keywords: ["architect", "architecte"], result: { category: "BTP", sector: "Architecte" } },
  // Restauration
  {
    keywords: ["restaurant", "bistro", "brasserie"],
    result: { category: "Restauration", sector: "Restaurant" },
  },
  {
    keywords: ["bakery", "boulanger", "boulangerie"],
    result: { category: "Restauration", sector: "Boulanger" },
  },
  {
    keywords: ["pastry", "patissier", "pâtissier", "patisserie"],
    result: { category: "Restauration", sector: "Pâtissier" },
  },
  {
    keywords: ["caterer", "traiteur", "catering"],
    result: { category: "Restauration", sector: "Traiteur" },
  },
  {
    keywords: ["bar", "cafe", "café", "coffee"],
    result: { category: "Restauration", sector: "Bar / Café" },
  },
  // Santé
  { keywords: ["dentist", "dentiste"], result: { category: "Santé", sector: "Dentiste" } },
  {
    keywords: ["doctor", "medecin", "médecin", "general practitioner"],
    result: { category: "Santé", sector: "Médecin généraliste" },
  },
  {
    keywords: ["pharmacy", "pharmacie", "pharmacien"],
    result: { category: "Santé", sector: "Pharmacien" },
  },
  {
    keywords: ["physiotherapist", "kine", "kiné", "kinesitherapeute"],
    result: { category: "Santé", sector: "Kinésithérapeute" },
  },
  { keywords: ["nurse", "infirmier"], result: { category: "Santé", sector: "Infirmier" } },
  {
    keywords: ["psychologist", "psychologue"],
    result: { category: "Santé", sector: "Psychologue" },
  },
  {
    keywords: ["osteopath", "osteopathe", "ostéopathe"],
    result: { category: "Santé", sector: "Ostéopathe" },
  },
  // Juridique
  {
    keywords: ["lawyer", "avocat", "attorney"],
    result: { category: "Juridique", sector: "Avocat" },
  },
  { keywords: ["notary", "notaire"], result: { category: "Juridique", sector: "Notaire" } },
  { keywords: ["bailiff", "huissier"], result: { category: "Juridique", sector: "Huissier" } },
  // Finance & Comptabilité
  {
    keywords: ["accountant", "comptable", "expert-comptable", "accounting"],
    result: { category: "Finance & Comptabilité", sector: "Expert-comptable" },
  },
  {
    keywords: ["tax", "fiscal"],
    result: { category: "Finance & Comptabilité", sector: "Conseiller fiscal" },
  },
  // Immobilier
  {
    keywords: ["real estate", "immobilier", "agent immobilier"],
    result: { category: "Immobilier", sector: "Agent immobilier" },
  },
  {
    keywords: ["property developer", "promoteur"],
    result: { category: "Immobilier", sector: "Promoteur immobilier" },
  },
  { keywords: ["syndic"], result: { category: "Immobilier", sector: "Syndic de copropriété" } },
  // Industrie / Auto
  {
    keywords: ["garage", "garagiste", "auto repair", "mechanic", "mecanicien", "mécanicien"],
    result: { category: "Industrie", sector: "Garagiste" },
  },
  {
    keywords: ["body shop", "carrossier", "carrosserie"],
    result: { category: "Industrie", sector: "Carrossier" },
  },
  // IT & Digital
  {
    keywords: ["web design", "developpeur", "développeur", "web developer", "software"],
    result: { category: "IT & Digital", sector: "Développeur web" },
  },
  {
    keywords: ["marketing agency", "agence marketing", "advertising"],
    result: { category: "IT & Digital", sector: "Agence marketing" },
  },
  {
    keywords: ["designer", "graphic design"],
    result: { category: "IT & Digital", sector: "Designer" },
  },
  // Transport & Logistique
  {
    keywords: ["moving", "demenageur", "déménageur", "mover"],
    result: { category: "Transport & Logistique", sector: "Déménageur" },
  },
  {
    keywords: ["transport", "transporteur", "trucking"],
    result: { category: "Transport & Logistique", sector: "Transporteur" },
  },
  {
    keywords: ["courier", "coursier", "delivery"],
    result: { category: "Transport & Logistique", sector: "Coursier" },
  },
  // Autre (services aux particuliers)
  {
    keywords: ["hair salon", "hairdresser", "coiffeur", "coiffure"],
    result: { category: "Autre", sector: "Coiffeur" },
  },
  {
    keywords: ["beauty", "esthetique", "esthéticienne", "estheticienne"],
    result: { category: "Autre", sector: "Esthéticienne" },
  },
  {
    keywords: ["photographer", "photographe"],
    result: { category: "Autre", sector: "Photographe" },
  },
  { keywords: ["coach", "coaching"], result: { category: "Autre", sector: "Coach" } },
  // Éducation
  {
    keywords: ["driving school", "auto-ecole", "auto-école"],
    result: { category: "Éducation", sector: "Auto-école" },
  },
  {
    keywords: ["training", "formation", "centre de formation"],
    result: { category: "Éducation", sector: "Centre de formation" },
  },
];

export function guessCategory(raw: string | null | undefined): Mapped | null {
  if (!raw) return null;
  const hay = raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); // strip accents
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      const needle = kw.normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (hay.includes(needle)) return rule.result;
    }
  }
  return null;
}
