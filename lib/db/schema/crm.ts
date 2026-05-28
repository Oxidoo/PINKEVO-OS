import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { idCol, timestamps } from "./_shared";
import { profiles } from "./auth";
import {
  activityDirection,
  activityEntityType,
  activityType,
  clientStatus,
  dealStage,
  leadSource,
  leadStatus,
} from "./enums";

export const clients = pgTable("clients", {
  id: idCol(),
  name: text("name").notNull(),
  company: text("company"),
  industry: text("industry"),
  status: clientStatus("status").notNull().default("prospect"),
  tags: text("tags").array().notNull().default([]),
  mrr: numeric("mrr", { precision: 12, scale: 2 }).notNull().default("0"),
  lifetimeValue: numeric("lifetime_value", { precision: 12, scale: 2 }).notNull().default("0"),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }),
  notes: text("notes"),
  ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
  ...timestamps,
});

export const contacts = pgTable("contacts", {
  id: idCol(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  position: text("position"),
  linkedinUrl: text("linkedin_url"),
  isPrimary: boolean("is_primary").notNull().default(false),
  ...timestamps,
});

export const leads = pgTable("leads", {
  id: idCol(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  category: text("category"),
  sector: text("sector"),
  zone: text("zone"),
  source: leadSource("source").notNull().default("manual"),
  status: leadStatus("status").notNull().default("new"),
  score: integer("score").notNull().default(0),
  enrichmentData: jsonb("enrichment_data").$type<Record<string, unknown>>(),
  assignedTo: uuid("assigned_to").references(() => profiles.id, { onDelete: "set null" }),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  convertedToClientId: uuid("converted_to_client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

export const deals = pgTable("deals", {
  id: idCol(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  stage: dealStage("stage").notNull().default("discovery"),
  probability: integer("probability").notNull().default(20),
  expectedCloseDate: date("expected_close_date"),
  ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
  ...timestamps,
});

export const activities = pgTable("activities", {
  id: idCol(),
  entityType: activityEntityType("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  type: activityType("type").notNull(),
  subject: text("subject"),
  content: text("content"),
  direction: activityDirection("direction"),
  performedBy: uuid("performed_by").references(() => profiles.id, { onDelete: "set null" }),
  performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  ...timestamps,
});

export const leadContacts = pgTable("lead_contacts", {
  id: idCol(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  method: varchar("method", { length: 10 }).notNull(), // "sms" | "email" | "call"
  note: text("note"),
  contactedAt: timestamp("contacted_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  ...timestamps,
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type LeadContact = InferSelectModel<typeof leadContacts>;
