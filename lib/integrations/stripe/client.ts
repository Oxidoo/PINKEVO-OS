import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key, { typescript: true }) : null;

export function stripeConfigured(): boolean {
  return Boolean(stripe);
}

export interface StripePaymentLinkOption {
  id: string;
  url: string;
  label: string;
  amount: number | null;
  currency: string;
  interval: "month" | "year" | "one_time" | null;
}

/**
 * Liste les Payment Links actifs du compte Stripe. Sert à proposer un
 * sélecteur dans le formulaire de devis (lien de paiement à inclure dans
 * le PDF/page publique).
 */
export async function listPaymentLinks(): Promise<StripePaymentLinkOption[]> {
  if (!stripe) return [];
  const out: StripePaymentLinkOption[] = [];
  const links = await stripe.paymentLinks.list({ active: true, limit: 100 });
  for (const link of links.data) {
    const items = await stripe.paymentLinks.listLineItems(link.id, { limit: 1 });
    const item = items.data[0];
    const price = item?.price ?? null;
    const productName =
      typeof price?.product === "object" && price.product && "name" in price.product
        ? String(price.product.name)
        : (item?.description ?? "Produit");
    out.push({
      id: link.id,
      url: link.url,
      label: productName,
      amount: price?.unit_amount != null ? price.unit_amount / 100 : null,
      currency: (price?.currency ?? "eur").toUpperCase(),
      interval:
        price?.recurring?.interval === "year"
          ? "year"
          : price?.recurring?.interval === "month"
            ? "month"
            : price?.type === "one_time"
              ? "one_time"
              : null,
    });
  }
  return out;
}
