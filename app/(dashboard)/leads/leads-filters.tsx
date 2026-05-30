"use client";

import { MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const LEAD_CATEGORIES = [
  "BTP",
  "Commerce & Retail",
  "Éducation",
  "Finance & Comptabilité",
  "Immobilier",
  "Industrie",
  "IT & Digital",
  "Juridique",
  "Restauration",
  "Santé",
  "Transport & Logistique",
  "Agriculture",
  "Autre",
] as const;

export const CATEGORY_SECTORS: Record<string, string[]> = {
  BTP: [
    "Architecte",
    "Carreleur",
    "Chauffagiste",
    "Climaticien",
    "Couvreur",
    "Électricien",
    "Maçon",
    "Menuisier",
    "Peintre",
    "Plombier",
  ],
  "Commerce & Retail": ["Commerçant", "E-commerce", "Franchise", "Autre"],
  Éducation: ["Auto-école", "Centre de formation", "École privée", "Tuteur", "Autre"],
  "Finance & Comptabilité": ["Conseiller fiscal", "Expert-comptable", "Conseiller en gestion"],
  Immobilier: ["Agent immobilier", "Promoteur immobilier", "Syndic de copropriété"],
  Industrie: ["Carrossier", "Garagiste", "Industriel", "Mécanicien", "Autre"],
  "IT & Digital": ["Agence marketing", "Designer", "Développeur web", "Consultant IT"],
  Juridique: ["Avocat", "Huissier", "Notaire"],
  Restauration: ["Boulanger", "Pâtissier", "Restaurant", "Traiteur", "Bar / Café"],
  Santé: [
    "Dentiste",
    "Infirmier",
    "Kinésithérapeute",
    "Médecin généraliste",
    "Pharmacien",
    "Psychologue",
    "Ostéopathe",
  ],
  "Transport & Logistique": ["Déménageur", "Transporteur", "Coursier"],
  Agriculture: ["Agriculteur", "Viticulteur", "Maraîcher", "Autre"],
  Autre: ["Coiffeur", "Coach", "Esthéticienne", "Photographe", "Autre"],
};

export const LEAD_SECTORS = [...new Set(Object.values(CATEGORY_SECTORS).flat())].sort() as string[];

export type LeadFilters = {
  query: string;
  category: string;
  sector: string;
  zone: string;
  website: "all" | "with" | "without";
  mobilePhone: "all" | "mobile" | "no-mobile";
  sort: "date" | "score" | "name";
};

export const DEFAULT_FILTERS: LeadFilters = {
  query: "",
  category: "all",
  sector: "all",
  zone: "",
  website: "all",
  mobilePhone: "all",
  sort: "date",
};

export function LeadsFilterBar({
  filters,
  onChange,
}: {
  filters: LeadFilters;
  onChange: (f: LeadFilters) => void;
}) {
  function set(key: keyof LeadFilters, value: string) {
    const next = { ...filters, [key]: value };
    // Reset sector when category changes
    if (key === "category") next.sector = "all";
    onChange(next);
  }

  const sectorsForCategory =
    filters.category !== "all"
      ? (CATEGORY_SECTORS[filters.category] ?? LEAD_SECTORS)
      : LEAD_SECTORS;

  const hasActiveFilters =
    filters.query !== "" ||
    filters.category !== "all" ||
    filters.sector !== "all" ||
    filters.zone !== "" ||
    filters.website !== "all" ||
    filters.mobilePhone !== "all";

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <div className="relative col-span-2 min-w-0 sm:min-w-36 sm:flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Nom, email, téléphone…"
          className="pl-8 pr-8"
          value={filters.query}
          onChange={(e) => set("query", e.target.value)}
        />
        {filters.query !== "" && (
          <button
            type="button"
            onClick={() => set("query", "")}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Zone (ville…)"
          className="w-full pl-8 sm:w-36"
          value={filters.zone}
          onChange={(e) => set("zone", e.target.value)}
        />
      </div>

      <Select value={filters.category} onValueChange={(v) => set("category", v)}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes catégories</SelectItem>
          {LEAD_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.sector} onValueChange={(v) => set("sector", v)}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Secteur" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous secteurs</SelectItem>
          {sectorsForCategory.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.website} onValueChange={(v) => set("website", v)}>
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Site web" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Site web : tous</SelectItem>
          <SelectItem value="with">Avec site web</SelectItem>
          <SelectItem value="without">Sans site web</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.mobilePhone} onValueChange={(v) => set("mobilePhone", v)}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Tél. portable" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tél. portable : tous</SelectItem>
          <SelectItem value="mobile">Portable uniquement</SelectItem>
          <SelectItem value="no-mobile">Sans portable</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sort} onValueChange={(v) => set("sort", v as LeadFilters["sort"])}>
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Plus récents</SelectItem>
          <SelectItem value="score">Meilleur score</SelectItem>
          <SelectItem value="name">Nom A → Z</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="col-span-2 sm:col-span-1"
        >
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
