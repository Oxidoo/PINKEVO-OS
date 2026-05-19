"use client";

import { Search } from "lucide-react";
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

export const LEAD_SECTORS = [
  // BTP
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
  // Santé
  "Dentiste",
  "Infirmier",
  "Kinésithérapeute",
  "Médecin généraliste",
  "Pharmacien",
  "Psychologue",
  "Ostéopathe",
  // Juridique / Finance
  "Avocat",
  "Expert-comptable",
  "Huissier",
  "Notaire",
  "Conseiller fiscal",
  // Immobilier
  "Agent immobilier",
  "Promoteur immobilier",
  // Services
  "Coiffeur",
  "Coach",
  "Esthéticienne",
  "Photographe",
  // Restauration
  "Boulanger",
  "Pâtissier",
  "Restaurant",
  "Traiteur",
  // Auto
  "Carrossier",
  "Garagiste",
  // IT & Digital
  "Agence marketing",
  "Designer",
  "Développeur web",
  // Transport
  "Déménageur",
  "Transporteur",
  "Autre",
] as const;

export type LeadFilters = {
  query: string;
  category: string;
  sector: string;
  sort: "date" | "score" | "name";
};

export const DEFAULT_FILTERS: LeadFilters = {
  query: "",
  category: "all",
  sector: "all",
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
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters =
    filters.query !== "" || filters.category !== "all" || filters.sector !== "all";

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-36 flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un lead…"
          className="pl-8"
          value={filters.query}
          onChange={(e) => set("query", e.target.value)}
        />
      </div>

      <Select value={filters.category} onValueChange={(v) => set("category", v)}>
        <SelectTrigger className="w-44">
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
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Secteur" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous secteurs</SelectItem>
          {LEAD_SECTORS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sort}
        onValueChange={(v) => set("sort", v as LeadFilters["sort"])}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Plus récents</SelectItem>
          <SelectItem value="score">Meilleur score</SelectItem>
          <SelectItem value="name">Nom A → Z</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
