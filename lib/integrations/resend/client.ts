import "server-only";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { db } from "@/lib/db/client";
import { emailMessages } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "PINKEVO <onboarding@resend.dev>";

export interface SendEmailArgs {
  to: string;
  subject: string;
  react: ReactElement;
  campaignId?: string;
  leadId?: string;
  contactId?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Render a React Email template, send it via Resend and log it to
 * `email_messages`. When RESEND_API_KEY is unset we still render + log the
 * message (status "queued") so flows remain testable without credentials.
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const html = await render(args.react);
  const text = await render(args.react, { plainText: true });

  let resendId: string | null = null;
  let status: "queued" | "sent" | "failed" = "queued";
  let error: string | undefined;

  if (resend) {
    const res = await resend.emails.send({
      from: FROM_EMAIL,
      to: args.to,
      subject: args.subject,
      html,
      text,
    });
    if (res.error) {
      status = "failed";
      error = res.error.message;
      logger.error({ err: res.error, to: args.to }, "resend send failed");
    } else {
      status = "sent";
      resendId = res.data?.id ?? null;
    }
  } else {
    logger.info({ to: args.to, subject: args.subject }, "RESEND_API_KEY unset — email logged only");
  }

  await db.insert(emailMessages).values({
    campaignId: args.campaignId ?? null,
    leadId: args.leadId ?? null,
    contactId: args.contactId ?? null,
    toEmail: args.to,
    fromEmail: FROM_EMAIL,
    subject: args.subject,
    bodyHtml: html,
    resendId,
    status,
  });

  return { ok: status !== "failed", id: resendId ?? undefined, error, skipped: !resend };
}
