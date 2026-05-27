import { leadProspector } from "./lead-prospector";
import { leadQualifier } from "./lead-qualifier";
import { perfAuditor } from "./perf-auditor";
import { seoAuditor } from "./seo-auditor";
import type { AgentHandler } from "./types";

export const AGENT_HANDLERS = {
  lead_prospector: leadProspector,
  lead_qualifier: leadQualifier,
  seo_auditor: seoAuditor,
  perf_auditor: perfAuditor,
} satisfies Record<string, AgentHandler>;

export type AgentSlug = keyof typeof AGENT_HANDLERS;

export function getHandler(slug: string): AgentHandler | null {
  return (AGENT_HANDLERS as Record<string, AgentHandler>)[slug] ?? null;
}
