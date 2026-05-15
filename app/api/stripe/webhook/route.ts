import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db/client";
import { invoices, subscriptions } from "@/lib/db/schema";
import { recomputeClientMrr, resolveClientId } from "@/lib/finance/sync";
import { stripe } from "@/lib/integrations/stripe/client";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  if (stripe && secret && sig) {
    try {
      event = stripe.webhooks.constructEvent(raw, sig, secret);
    } catch (err) {
      logger.error({ err }, "stripe signature verification failed");
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(raw) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const clientId = await resolveClientId(
          sub.metadata?.client_id,
          typeof sub.customer === "object" ? (sub.customer as Stripe.Customer).email : null,
        );
        if (!clientId) {
          logger.warn({ sub: sub.id }, "stripe subscription with no matching client");
          break;
        }
        const item = sub.items.data[0];
        const amount = (item?.price.unit_amount ?? 0) / 100;
        const interval = item?.price.recurring?.interval === "year" ? "year" : "month";
        const values = {
          clientId,
          stripeSubscriptionId: sub.id,
          planName: String(item?.price.nickname ?? item?.price.product ?? "Plan"),
          amount: String(amount),
          interval: interval as "month" | "year",
          status: event.type === "customer.subscription.deleted" ? "canceled" : sub.status,
          startedAt: new Date(sub.start_date * 1000),
          currentPeriodEnd: item?.current_period_end
            ? new Date(item.current_period_end * 1000)
            : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
        const [existing] = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, sub.id))
          .limit(1);
        if (existing) {
          await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
        } else {
          await db.insert(subscriptions).values(values);
        }
        await recomputeClientMrr(clientId);
        break;
      }
      case "invoice.created":
      case "invoice.finalized":
      case "invoice.paid":
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const clientId = await resolveClientId(inv.metadata?.client_id, inv.customer_email);
        if (!clientId || !inv.id) break;
        const values = {
          clientId,
          stripeInvoiceId: inv.id,
          number: inv.number ?? null,
          amount: String((inv.amount_due ?? 0) / 100),
          tax: String((inv.total_taxes?.[0]?.amount ?? 0) / 100),
          total: String((inv.total ?? 0) / 100),
          currency: (inv.currency ?? "eur").toUpperCase(),
          status: (inv.status ?? "draft") as "draft" | "open" | "paid" | "void" | "uncollectible",
          issuedAt: inv.created ? new Date(inv.created * 1000) : null,
          paidAt: event.type === "invoice.paid" ? new Date() : null,
          pdfUrl: inv.invoice_pdf ?? null,
        };
        const [existing] = await db
          .select({ id: invoices.id })
          .from(invoices)
          .where(eq(invoices.stripeInvoiceId, inv.id))
          .limit(1);
        if (existing) {
          await db.update(invoices).set(values).where(eq(invoices.id, existing.id));
        } else {
          await db.insert(invoices).values(values);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    logger.error({ err, type: event.type }, "stripe webhook handler error");
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
