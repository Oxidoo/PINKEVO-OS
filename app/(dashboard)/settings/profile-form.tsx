"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type SimpleState, updateMyProfile } from "@/lib/auth/profile-actions";
import { ROLE_LABELS_FR } from "@/lib/auth/rbac";
import type { Profile } from "@/lib/db/schema";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement…" : "Enregistrer"}
    </Button>
  );
}

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, action] = useActionState<SimpleState, FormData>(updateMyProfile, undefined);

  useEffect(() => {
    if (state?.ok) toast.success("Profil mis à jour");
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>
          Ces informations sont visibles par toute l&apos;équipe PINKEVO.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={profile.fullName ?? ""}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Rôle</Label>
            <Input id="role" value={ROLE_LABELS_FR[profile.role]} disabled />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="telegramChatId">Chat ID Telegram</Label>
            <Input
              id="telegramChatId"
              name="telegramChatId"
              defaultValue={profile.telegramChatId ?? ""}
              placeholder="Pour recevoir les rapports quotidiens du bot"
            />
          </div>
          <div className="sm:col-span-2">
            <SaveButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
