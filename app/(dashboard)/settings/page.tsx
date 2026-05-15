import { isNull } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasRole } from "@/lib/auth/rbac";
import { getProfile, getUser } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { profiles, teamInvitations } from "@/lib/db/schema";
import { IntegrationsPanel } from "./integrations-panel";
import { ProfileForm } from "./profile-form";
import { TeamPanel } from "./team-panel";

export default async function SettingsPage() {
  const [profile, user] = await Promise.all([getProfile(), getUser()]);
  if (!profile || !user) return null;

  const canManageTeam = hasRole(profile.role, ["owner", "admin"]);

  const [members, pendingInvites] = canManageTeam
    ? await Promise.all([
        db.select().from(profiles),
        db.select().from(teamInvitations).where(isNull(teamInvitations.acceptedAt)),
      ])
    : [[], []];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Profil, équipe, intégrations. Bienvenue {profile.fullName ?? user.email}.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          {canManageTeam && <TabsTrigger value="team">Équipe</TabsTrigger>}
          <TabsTrigger value="integrations">Intégrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileForm profile={profile} email={user.email ?? ""} />
        </TabsContent>

        {canManageTeam && (
          <TabsContent value="team" className="mt-6">
            <TeamPanel currentUserId={profile.id} members={members} invitations={pendingInvites} />
          </TabsContent>
        )}

        <TabsContent value="integrations" className="mt-6">
          <IntegrationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
