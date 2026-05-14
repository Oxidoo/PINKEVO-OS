import { pgSchema, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { pgTable, varchar } from "drizzle-orm/pg-core";
import { idCol, timestamps } from "./_shared";
import { locale, theme, userRole } from "./enums";

// Reference to Supabase's managed auth.users table (we don't manage its schema,
// we only point to it for foreign keys).
export const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const profiles = pgTable("profiles", {
  // 1:1 with auth.users — same UUID.
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  role: userRole("role").notNull().default("viewer"),
  locale: locale("locale").notNull().default("fr"),
  theme: theme("theme").notNull().default("system"),
  telegramChatId: varchar("telegram_chat_id", { length: 64 }),
  ...timestamps,
});

export const teamInvitations = pgTable("team_invitations", {
  id: idCol(),
  email: text("email").notNull(),
  role: userRole("role").notNull().default("viewer"),
  token: text("token").notNull().unique(),
  invitedBy: uuid("invited_by").references(() => profiles.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  ...timestamps,
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type NewTeamInvitation = typeof teamInvitations.$inferInsert;
