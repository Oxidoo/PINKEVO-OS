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
} from "drizzle-orm/pg-core";
import { idCol, timestamps } from "./_shared";
import { profiles } from "./auth";
import { clients } from "./crm";
import { auditType, cmsType, projectStatus, taskPriority, taskStatus } from "./enums";

export const projects = pgTable("projects", {
  id: idCol(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: projectStatus("status").notNull().default("briefing"),
  startDate: date("start_date"),
  deliveryDate: date("delivery_date"),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
  ...timestamps,
});

export const tasks = pgTable("tasks", {
  id: idCol(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatus("status").notNull().default("todo"),
  priority: taskPriority("priority").notNull().default("med"),
  dueDate: date("due_date"),
  assignedTo: uuid("assigned_to").references(() => profiles.id, { onDelete: "set null" }),
  ...timestamps,
});

export const websites = pgTable("websites", {
  id: idCol(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  url: text("url").notNull().unique(),
  name: text("name").notNull(),
  cms: cmsType("cms").notNull().default("other"),
  gscConnected: boolean("gsc_connected").notNull().default(false),
  monitoringEnabled: boolean("monitoring_enabled").notNull().default(true),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  ...timestamps,
});

export const audits = pgTable("audits", {
  id: idCol(),
  websiteId: uuid("website_id")
    .notNull()
    .references(() => websites.id, { onDelete: "cascade" }),
  type: auditType("type").notNull(),
  score: integer("score"),
  rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
  reportUrl: text("report_url"),
  runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
  triggeredBy: uuid("triggered_by").references(() => profiles.id, { onDelete: "set null" }),
  ...timestamps,
});

export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Website = typeof websites.$inferSelect;
export type Audit = typeof audits.$inferSelect;
