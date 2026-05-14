import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { idCol, timestamps } from "./_shared";
import { profiles } from "./auth";
import { agentRunStatus, agentSlug, automationTriggerType } from "./enums";

export const agents = pgTable("agents", {
  id: idCol(),
  slug: agentSlug("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  systemPrompt: text("system_prompt").notNull(),
  model: varchar("model", { length: 64 }).notNull(),
  ...timestamps,
});

export const agentRuns = pgTable("agent_runs", {
  id: idCol(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  triggeredBy: uuid("triggered_by").references(() => profiles.id, { onDelete: "set null" }),
  input: jsonb("input").$type<Record<string, unknown>>(),
  output: jsonb("output").$type<Record<string, unknown>>(),
  status: agentRunStatus("status").notNull().default("queued"),
  tokensInput: integer("tokens_input"),
  tokensOutput: integer("tokens_output"),
  costUsd: numeric("cost_usd", { precision: 12, scale: 6 }),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  error: text("error"),
  ...timestamps,
});

export const automations = pgTable("automations", {
  id: idCol(),
  name: text("name").notNull(),
  triggerType: automationTriggerType("trigger_type").notNull(),
  triggerConfig: jsonb("trigger_config").$type<Record<string, unknown>>().notNull().default({}),
  steps: jsonb("steps").$type<Array<Record<string, unknown>>>().notNull().default([]),
  enabled: boolean("enabled").notNull().default(false),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  ...timestamps,
});

export type Agent = typeof agents.$inferSelect;
export type AgentRun = typeof agentRuns.$inferSelect;
export type NewAgentRun = typeof agentRuns.$inferInsert;
export type Automation = typeof automations.$inferSelect;
