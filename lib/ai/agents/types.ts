import type { z } from "zod";

export interface AgentRunContext {
  triggeredBy: string | null;
}

export interface AgentExecResult {
  output: Record<string, unknown>;
  tokensInput: number;
  tokensOutput: number;
  /** Short human summary shown in the run history. */
  summary: string;
}

export interface AgentHandler<TInput extends z.ZodTypeAny = z.ZodTypeAny> {
  slug: string;
  /** Default model id; can be overridden by the agent's DB config. */
  defaultModel: string;
  inputSchema: TInput;
  run: (input: z.infer<TInput>, model: string, ctx: AgentRunContext) => Promise<AgentExecResult>;
}
