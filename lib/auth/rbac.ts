export const ROLES = ["owner", "admin", "manager", "sales", "producer", "viewer"] as const;
export type Role = (typeof ROLES)[number];

/** Strict role inclusion check. */
export function hasRole(role: Role | undefined | null, allowed: readonly Role[]): boolean {
  return role != null && allowed.includes(role);
}

/** Convenience role groupings used across modules. */
export const ROLE_GROUPS = {
  admins: ["owner", "admin"] as const,
  managers: ["owner", "admin", "manager"] as const,
  salesTeam: ["owner", "admin", "manager", "sales"] as const,
  productionTeam: ["owner", "admin", "manager", "producer"] as const,
  everyone: ROLES,
} as const;

/** Human-readable label for a role (FR). */
export const ROLE_LABELS_FR: Record<Role, string> = {
  owner: "Propriétaire",
  admin: "Admin",
  manager: "Manager",
  sales: "Sales",
  producer: "Producer",
  viewer: "Lecteur",
};
