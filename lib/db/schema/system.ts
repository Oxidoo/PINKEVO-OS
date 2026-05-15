import { bigint, inet, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { idCol, timestamps } from "./_shared";
import { profiles } from "./auth";
import { clients } from "./crm";
import { documentType, integrationProvider } from "./enums";
import { projects } from "./projects";

export const documents = pgTable("documents", {
  id: idCol(),
  name: text("name").notNull(),
  type: documentType("type").notNull().default("other"),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  storagePath: text("storage_path").notNull(),
  mimeType: varchar("mime_type", { length: 128 }),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  uploadedBy: uuid("uploaded_by").references(() => profiles.id, { onDelete: "set null" }),
  ...timestamps,
});

export const notifications = pgTable("notifications", {
  id: idCol(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 64 }).notNull(),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  readAt: timestamp("read_at", { withTimezone: true }),
  ...timestamps,
});

export const auditLogs = pgTable("audit_logs", {
  id: idCol(),
  actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  action: varchar("action", { length: 96 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  ...timestamps,
});

export const integrations = pgTable("integrations", {
  id: idCol(),
  provider: integrationProvider("provider").notNull(),
  connectedBy: uuid("connected_by").references(() => profiles.id, { onDelete: "set null" }),
  accessTokenEncrypted: text("access_token_encrypted"),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  scope: text("scope"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
});

export type Document = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
