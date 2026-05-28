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
 * Liste les Payment Links actifs du compte Stripe avec les vrais noms
 * de produits (product est explicitement expanded). Limite : 100 max.
 */
export async function listPaymentLinks(): Promise<StripePaymentLinkOption[]> {
  if (!stripe) return [];
  const links = await stripe.paymentLinks.list({ active: true, limit: 100 });
  const out: StripePaymentLinkOption[] = [];
  for (const link of links.data) {
    try {
      const items = await stripe.paymentLinks.listLineItems(link.id, {
        limit: 5,
        expand: ["data.price.product"],
      });
      const item = items.data[0];
      const price = item?.price ?? null;
      const product = price?.product;
      const productName =
        typeof product === "object" && product && "name" in product
          ? String((product as Stripe.Product).name)
          : item?.description || `Lien ${link.id.slice(-6)}`;
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
    } catch {
      // Le lien existe mais on ne peut pas en lire les line items (rare).
      // On l'expose quand même avec un label générique.
      out.push({
        id: link.id,
        url: link.url,
        label: `Lien ${link.id.slice(-6)}`,
        amount: null,
        currency: "EUR",
        interval: null,
      });
    }
  }
  return out;
}
