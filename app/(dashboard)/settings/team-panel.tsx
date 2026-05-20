"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  inviteTeammate,
  revokeInvitation,
  type SimpleState,
  updateMemberRole,
} from "@/lib/auth/profile-actions";
import { ROLE_LABELS_FR, ROLES, type Role } from "@/lib/auth/rbac";
import type { Profile, TeamInvitation } from "@/lib/db/schema";

function InviteSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Envoi…" : "Inviter"}
    </Button>
  );
}

interface TeamPanelProps {
  currentUserId: string;
  members: Profile[];
  invitations: TeamInvitation[];
}

export function TeamPanel({ currentUserId, members, invitations }: TeamPanelProps) {
  const router = useRouter();
  const [state, action] = useActionState<SimpleState, FormData>(inviteTeammate, undefined);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state?.ok) {
      toast.success("Invitation envoyée");
      router.refresh();
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  const onRoleChange = (memberId: string, role: Role) => {
    startTransition(async () => {
      const res = await updateMemberRole(memberId, role);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Rôle mis à jour");
        router.refresh();
      }
    });
  };

  const onRevoke = (id: string) => {
    startTransition(async () => {
      const res = await revokeInvitation(id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Invitation révoquée");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Inviter un coéquipier</CardTitle>
          <CardDescription>
            Le rôle est attribué dès la création du compte avec l&apos;email invité.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" name="email" type="email" required />
            </div>
            <div className="w-48 space-y-1.5">
              <Label htmlFor="invite-role">Rôle</Label>
              <Select name="role" defaultValue="viewer">
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter((r) => r !== "owner").map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS_FR[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <InviteSubmit />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membres ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="hidden sm:table-cell">Ajouté le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.fullName ?? "—"}</TableCell>
                  <TableCell>
                    {m.id === currentUserId || m.role === "owner" ? (
                      <Badge variant="secondary">{ROLE_LABELS_FR[m.role]}</Badge>
                    ) : (
                      <Select
                        defaultValue={m.role}
                        onValueChange={(v) => onRoleChange(m.id, v as Role)}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.filter((r) => r !== "owner").map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS_FR[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {format(m.createdAt, "d MMM yyyy", { locale: fr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitations en attente ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Expire le</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS_FR[inv.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(inv.expiresAt, "d MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => onRevoke(inv.id)}>
                        Révoquer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
