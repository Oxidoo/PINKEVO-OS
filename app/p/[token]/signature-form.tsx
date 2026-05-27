"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signProposal } from "@/lib/proposals/public";

export function SignatureForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);

  function onSubmit(formData: FormData) {
    start(async () => {
      const r = await signProposal(token, formData);
      if (r.ok) {
        toast.success("Devis signé. Merci !");
        router.refresh();
      } else {
        toast.error(r.error ?? "Erreur");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Signature électronique</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Saisissez votre nom complet pour signer le devis. Votre IP et la date sont enregistrés.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">Nom et prénom</Label>
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
          className="mt-0.5 accent-pink-500"
          required
        />
        <span className="text-muted-foreground">
          J&apos;ai lu et j&apos;accepte les conditions de cette proposition. Ma signature
          électronique a la même valeur juridique qu&apos;une signature manuscrite (eIDAS,
          niveau simple).
        </span>
      </label>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || name.trim().length < 2 || !accepted}
      >
        {pending ? "Signature…" : "Signer le devis"}
      </Button>
    </form>
  );
}
