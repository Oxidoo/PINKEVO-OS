import {
  bigint,
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
import { idCol, timestamps } from "./_shared";
import { clients, deals, leads } from "./crm";
import {
  apiProvider,
  expenseCategory,
  invoiceStatus,
  proposalStatus,
  subscriptionInterval,
} from "./enums";

export const subscriptions = pgTable("subscriptions", {
  id: idCol(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 128 }).unique(),
  planName: text("plan_name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  interval: subscriptionInterval("interval").notNull().default("month"),
  status: varchar("status", { length: 32 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  ...timestamps,
});

export const invoices = pgTable("invoices", {
  id: idCol(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 128 }).unique(),
  number: varchar("number", { length: 64 }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  status: invoiceStatus("status").notNull().default("draft"),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  pdfUrl: text("pdf_url"),
  ...timestamps,
});

export const proposalTemplates = pgTable("proposal_templates", {
  id: idCol(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  // Structure du devis : titre, contexte, objectifs[], livrables[], planning,
  // conditions. Les valeurs sont des chaînes contenant des variables `{{client}}`,
  // `{{date}}`, `{{prix_setup}}`, etc., substituées à la création du devis.
  sections: jsonb("sections")
    .$type<{
      title: string;
      context: string;
      objectives: string[];
      deliverables: string[];
      timeline: string;
      conditions: string;
    }>()
    .notNull(),
  defaultSetup: numeric("default_setup", { precision: 12, scale: 2 }).notNull().default("0"),
  defaultRecurring: numeric("default_recurring", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  variables: text("variables").array().notNull().default([]),
  ...timestamps,
});

export const proposals = pgTable("proposals", {
  id: idCol(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  templateId: uuid("template_id").references(() => proposalTemplates.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  totalSetup: numeric("total_setup", { precision: 12, scale: 2 }).notNull().default("0"),
  totalRecurring: numeric("total_recurring", { precision: 12, scale: 2 }).notNull().default("0"),
  status: proposalStatus("status").notNull().default("draft"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  pdfUrl: text("pdf_url"),
  signatureUrl: text("signature_url"),
  signatureToken: text("signature_token").unique(),
  signatureName: text("signature_name"),
  signedIp: varchar("signed_ip", { length: 64 }),
  paymentLinkUrl: text("payment_link_url"),
  paymentLinkLabel: text("payment_link_label"),
  ...timestamps,
});

export const expenses = pgTable("expenses", {
  id: idCol(),
  category: expenseCategory("category").notNull(),
  vendor: text("vendor"),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  billingPeriodStart: date("billing_period_start"),
  billingPeriodEnd: date("billing_period_end"),
  autoSynced: boolean("auto_synced").notNull().default(false),
  sourceProvider: varchar("source_provider", { length: 64 }),
  ...timestamps,
});

export const toolSubscriptions = pgTable("tool_subscriptions", {
  id: idCol(),
  name: text("name").notNull(),
  vendor: text("vendor"),
  category: text("category"),
  monthlyCost: numeric("monthly_cost", { precision: 12, scale: 2 }),
  annualCost: numeric("annual_cost", { precision: 12, scale: 2 }),
  seats: integer("seats"),
  renewalDate: date("renewal_date"),
  autoSynced: boolean("auto_synced").notNull().default(false),
  apiKeyEncrypted: text("api_key_encrypted"),
  ...timestamps,
});

export const apiUsage = pgTable("api_usage", {
  id: idCol(),
  provider: apiProvider("provider").notNull(),
  date: date("date").notNull(),
  tokens: bigint("tokens", { mode: "number" }),
  requests: integer("requests").notNull().default(0),
  costUsd: numeric("cost_usd", { precision: 12, scale: 6 }).notNull().default("0"),
  rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
  ...timestamps,
});

export type Subscription = typeof subscriptions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type ProposalTemplate = typeof proposalTemplates.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ToolSubscription = typeof toolSubscriptions.$inferSelect;
export type ApiUsage = typeof apiUsage.$inferSelect;
