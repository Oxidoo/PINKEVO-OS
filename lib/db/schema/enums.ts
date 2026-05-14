import { pgEnum } from "drizzle-orm/pg-core";

// Auth & team
export const userRole = pgEnum("user_role", [
  "owner",
  "admin",
  "manager",
  "sales",
  "producer",
  "viewer",
]);
export const locale = pgEnum("locale", ["fr", "en"]);
export const theme = pgEnum("theme", ["light", "dark", "system"]);

// CRM
export const clientStatus = pgEnum("client_status", ["prospect", "active", "churned"]);
export const leadSource = pgEnum("lead_source", [
  "csv",
  "pappers",
  "google_maps",
  "form",
  "manual",
  "agent",
]);
export const leadStatus = pgEnum("lead_status", [
  "new",
  "enriched",
  "contacted",
  "qualified",
  "converted",
  "lost",
]);
export const dealStage = pgEnum("deal_stage", [
  "discovery",
  "proposal",
  "negotiation",
  "won",
  "lost",
]);
export const activityEntityType = pgEnum("activity_entity_type", ["client", "lead", "deal"]);
export const activityType = pgEnum("activity_type", [
  "email",
  "call",
  "meeting",
  "note",
  "task",
  "agent_action",
]);
export const activityDirection = pgEnum("activity_direction", ["inbound", "outbound"]);

// Projects
export const projectStatus = pgEnum("project_status", [
  "briefing",
  "design",
  "dev",
  "review",
  "live",
  "maintenance",
]);
export const taskStatus = pgEnum("task_status", ["todo", "doing", "done"]);
export const taskPriority = pgEnum("task_priority", ["low", "med", "high"]);
export const cmsType = pgEnum("cms_type", ["webflow", "framer", "wordpress", "next", "other"]);
export const auditType = pgEnum("audit_type", ["seo", "performance"]);

// Agents
export const agentSlug = pgEnum("agent_slug", [
  "lead_prospector",
  "lead_qualifier",
  "proposal_writer",
  "seo_auditor",
  "perf_auditor",
]);
export const agentRunStatus = pgEnum("agent_run_status", [
  "queued",
  "running",
  "success",
  "failed",
]);
export const automationTriggerType = pgEnum("automation_trigger_type", [
  "cron",
  "event",
  "webhook",
  "manual",
]);

// Communication
export const emailTemplateCategory = pgEnum("email_template_category", [
  "outreach",
  "follow_up",
  "proposal",
  "invoice",
  "transactional",
]);
export const emailCampaignStatus = pgEnum("email_campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "paused",
]);
export const emailMessageStatus = pgEnum("email_message_status", [
  "queued",
  "sent",
  "delivered",
  "bounced",
  "failed",
]);
export const calendarProvider = pgEnum("calendar_provider", ["google", "cal_com"]);

// Finance
export const subscriptionInterval = pgEnum("subscription_interval", ["month", "year"]);
export const invoiceStatus = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
]);
export const proposalStatus = pgEnum("proposal_status", [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
]);
export const expenseCategory = pgEnum("expense_category", [
  "tool",
  "api",
  "salary",
  "marketing",
  "other",
]);
export const apiProvider = pgEnum("api_provider", [
  "anthropic",
  "openai",
  "elevenlabs",
  "resend",
  "psi",
  "gsc",
]);

// System
export const documentType = pgEnum("document_type", [
  "contract",
  "brief",
  "asset",
  "report",
  "other",
]);
export const integrationProvider = pgEnum("integration_provider", [
  "google",
  "cal_com",
  "stripe",
  "resend",
  "gsc",
  "telegram",
  "pappers",
  "anthropic",
  "openai",
  "elevenlabs",
]);
