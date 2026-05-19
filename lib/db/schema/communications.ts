import { integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { idCol, timestamps } from "./_shared";
import { clients, contacts, leads } from "./crm";
import {
  calendarProvider,
  emailCampaignStatus,
  emailMessageStatus,
  emailTemplateCategory,
} from "./enums";

export const emailTemplates = pgTable("email_templates", {
  id: idCol(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  variables: text("variables").array().notNull().default([]),
  category: emailTemplateCategory("category").notNull().default("transactional"),
  ...timestamps,
});

export const emailCampaigns = pgTable("email_campaigns", {
  id: idCol(),
  name: text("name").notNull(),
  templateId: uuid("template_id").references(() => emailTemplates.id, { onDelete: "set null" }),
  audienceFilter: jsonb("audience_filter").$type<Record<string, unknown>>(),
  status: emailCampaignStatus("status").notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentCount: integer("sent_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
});

export const emailMessages = pgTable("email_messages", {
  id: idCol(),
  campaignId: uuid("campaign_id").references(() => emailCampaigns.id, { onDelete: "set null" }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  toEmail: text("to_email").notNull(),
  fromEmail: text("from_email").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html"),
  resendId: varchar("resend_id", { length: 128 }),
  status: emailMessageStatus("status").notNull().default("queued"),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  bouncedAt: timestamp("bounced_at", { withTimezone: true }),
  ...timestamps,
});

export const calendarEvents = pgTable("calendar_events", {
  id: idCol(),
  externalId: varchar("external_id", { length: 256 }),
  provider: calendarProvider("provider").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  attendees: jsonb("attendees").$type<Array<{ email: string; name?: string }>>(),
  meetingUrl: text("meeting_url"),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  notes: text("notes"),
  ...timestamps,
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type EmailMessage = typeof emailMessages.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
