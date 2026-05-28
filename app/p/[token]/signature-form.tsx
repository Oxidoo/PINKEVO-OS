"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { signProposal } from "@/lib/proposals/public";

const ACCEPT_PHRASE = "Bon pour accord — Lu et approuvé";

export function SignatureForm({ token, grandTotal }: { token: string; grandTotal: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [phrase, setPhrase] = useState("");
  const [accepted, setAccepted] = useState(false);

  const phraseOk =
    phrase.trim().toLowerCase().replace(/\s+/g, " ") ===
    ACCEPT_PHRASE.toLowerCase().replace(/\s+/g, " ");

  function onSubmit(formData: FormData) {
    if (!phraseOk) {
      toast.error(`Recopiez exactement : « ${ACCEPT_PHRASE} »`);
      return;
    }
    start(async () => {
      const r = await signProposal(token, formData);
      if (r.ok) {
        toast.success("Devis signé. Vous pouvez maintenant procéder au paiement.");
        router.refresh();
      } else {
        toast.error(r.error ?? "Erreur");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Signature électronique</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pour accepter ce devis d&apos;un montant de{" "}
          <span className="font-semibold text-foreground">{formatCurrency(grandTotal)}</span>,
          recopiez la mention ci-dessous et signez avec votre nom complet.
        </p>
      </div>

      <div className="rounded-lg border-l-4 border-brand-500 bg-white p-3 text-center font-semibold italic text-brand-700">
        « {ACCEPT_PHRASE} »
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phrase">Recopier la mention manuscrite *</Label>
        <Input
          id="phrase"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={ACCEPT_PHRASE}
          required
          autoComplete="off"
        />
        {phrase.length > 0 && !phraseOk && (
          <p className="text-xs text-warning">La mention doit être recopiée à l&apos;identique.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Nom et prénom *</Label>
        <Input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          placeholder="Marie Dupont"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 accent-brand-500"
          required
        />
        <span className="text-muted-foreground">
          J&apos;ai lu et j&apos;accepte les conditions du devis et les mentions légales. Ma
          signature électronique (nom + mention + horodatage + adresse IP) a la même valeur
          juridique qu&apos;une signature manuscrite (eIDAS, niveau simple).
        </span>
      </label>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || name.trim().length < 2 || !phraseOk || !accepted}
      >
        <CheckCircle2 className="mr-2 size-4" />
        {pending ? "Signature en cours…" : "Signer le devis"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Une fois signé, le bouton de paiement Stripe apparaîtra ci-dessus.
      </p>
    </form>
  );
}
