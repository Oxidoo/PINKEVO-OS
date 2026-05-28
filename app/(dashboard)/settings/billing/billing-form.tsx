"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAgencySettings } from "@/lib/agency/settings";
import type { AgencySettings } from "@/lib/db/schema";

function field(label: string, name: string, value: string | null | undefined, type = "text") {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={value ?? ""} />
    </div>
  );
}

export function BillingForm({ initial }: { initial: AgencySettings | null }) {
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    const input = Object.fromEntries(formData.entries()) as Record<string, string>;
    start(async () => {
      const r = await updateAgencySettings(input);
      if (r.ok) toast.success("Infos prestataire enregistrées");
      else toast.error(r.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Identité</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("Raison sociale *", "legalName", initial?.legalName)}
          {field("Nom commercial", "tradingName", initial?.tradingName)}
        </div>
        {field(
          "Statut juridique",
          "legalStatus",
          initial?.legalStatus ?? "Autoentrepreneur — Consultant Digital",
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {field("SIRET", "siret", initial?.siret)}
          {field("Code APE / NAF", "apeCode", initial?.apeCode)}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">TVA</h2>
        {field(
          "Régime TVA",
          "vatRegime",
          initial?.vatRegime ?? "Franchise en base de TVA — Art. 293 B du CGI",
        )}
        {field("N° TVA intracommunautaire", "vatNumber", initial?.vatNumber)}
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Contact</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("Email", "email", initial?.email, "email")}
          {field("Téléphone", "phone", initial?.phone)}
        </div>
        {field("Site web", "website", initial?.website, "url")}
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Adresse</h2>
        {field("Rue / Avenue", "address", initial?.address)}
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_1fr]">
          {field("Code postal", "postalCode", initial?.postalCode)}
          {field("Ville", "city", initial?.city)}
          {field("Pays", "country", initial?.country ?? "France")}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Paiement</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("IBAN", "iban", initial?.iban)}
          {field("BIC", "bic", initial?.bic)}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Mentions légales</h2>
        {field(
          "Juridiction compétente",
          "jurisdiction",
          initial?.jurisdiction ?? "Tribunal de commerce de Paris",
        )}
        {field(
          "Couleur de marque (hex)",
          "brandColor",
          initial?.brandColor ?? "#1d4ed8",
        )}
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
