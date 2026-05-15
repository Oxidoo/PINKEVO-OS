/**
 * Seed — données de démo crédibles pour PINKEVO OS.
 * Run: pnpm seed
 *
 * Profiles dépendent de auth.users (géré par Supabase) — on ne seed donc pas
 * les profiles ici; owner_id reste null, ce qui est permis par le schema.
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[seed] DATABASE_URL manquant dans .env.local");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });
const db = drizzle(sql, { schema, casing: "snake_case" });

async function main() {
  console.info("[seed] insertion des clients…");
  const clientsData = [
    {
      name: "Boulangerie Lévain",
      company: "Lévain SARL",
      industry: "Food",
      status: "active" as const,
      mrr: "890",
      tags: ["seo", "site"],
    },
    {
      name: "Studio Yoga Zen",
      company: "Zen SAS",
      industry: "Wellness",
      status: "active" as const,
      mrr: "1490",
      tags: ["pack-agence"],
    },
    {
      name: "Cabinet Dentaire Sourire",
      company: "Sourire SELARL",
      industry: "Santé",
      status: "active" as const,
      mrr: "2200",
      tags: ["seo", "ads"],
    },
    {
      name: "Garage Auto Pro",
      company: "AutoPro SARL",
      industry: "Auto",
      status: "prospect" as const,
      mrr: "0",
      tags: ["lead"],
    },
    {
      name: "Restaurant Le Gourmet",
      company: "Gourmet SAS",
      industry: "Food",
      status: "churned" as const,
      mrr: "0",
      tags: [],
    },
  ];
  const insertedClients = await db
    .insert(schema.clients)
    .values(
      clientsData.map((c) => ({
        ...c,
        acquiredAt: c.status === "active" ? new Date(2024, 8, 1) : null,
        lifetimeValue: c.status === "active" ? "12000" : "0",
      })),
    )
    .returning({ id: schema.clients.id, name: schema.clients.name });

  console.info("[seed] contacts…");
  await db.insert(schema.contacts).values(
    insertedClients.slice(0, 3).map((c, i) => ({
      clientId: c.id,
      firstName: ["Marie", "Julien", "Sophie"][i] ?? "Alex",
      lastName: ["Durand", "Martin", "Bernard"][i] ?? "Petit",
      email: `contact${i}@exemple.fr`,
      phone: `+33 6 12 34 56 0${i}`,
      position: "Gérant",
      isPrimary: true,
    })),
  );

  console.info("[seed] leads…");
  await db.insert(schema.leads).values([
    {
      firstName: "Paul",
      lastName: "Lefèvre",
      email: "paul@coiffure-paul.fr",
      company: "Coiffure Paul",
      source: "google_maps",
      status: "new",
      score: 0,
    },
    {
      firstName: "Lucie",
      lastName: "Moreau",
      email: "lucie@fleurs-lucie.fr",
      company: "Fleurs & Co",
      source: "csv",
      status: "enriched",
      score: 62,
    },
    {
      firstName: "Karim",
      lastName: "Benali",
      email: "karim@pizza-napoli.fr",
      company: "Pizza Napoli",
      source: "pappers",
      status: "contacted",
      score: 78,
    },
    {
      firstName: "Emma",
      lastName: "Rousseau",
      company: "Cabinet Avocat Rousseau",
      source: "manual",
      status: "qualified",
      score: 88,
    },
    {
      firstName: "Tom",
      lastName: "Girard",
      email: "tom@menuiserie-girard.fr",
      company: "Menuiserie Girard",
      source: "agent",
      status: "new",
      score: 0,
    },
  ]);

  console.info("[seed] deals…");
  await db.insert(schema.deals).values([
    {
      title: "Refonte site Lévain",
      clientId: insertedClients[0]?.id,
      value: "4500",
      stage: "won",
      probability: 100,
    },
    {
      title: "SEO récurrent Zen",
      clientId: insertedClients[1]?.id,
      value: "1490",
      stage: "negotiation",
      probability: 70,
    },
    {
      title: "Pack agence Sourire",
      clientId: insertedClients[2]?.id,
      value: "8800",
      stage: "proposal",
      probability: 45,
    },
    {
      title: "Audit SEO Garage",
      clientId: insertedClients[3]?.id,
      value: "1200",
      stage: "discovery",
      probability: 20,
    },
  ]);

  console.info("[seed] activités…");
  if (insertedClients[0]) {
    await db.insert(schema.activities).values([
      {
        entityType: "client",
        entityId: insertedClients[0].id,
        type: "note",
        content: "Premier contact très positif, intéressé par une refonte.",
      },
      {
        entityType: "client",
        entityId: insertedClients[0].id,
        type: "call",
        content: "Appel de cadrage 30 min, budget validé.",
      },
    ]);
  }

  console.info("[seed] ✅ terminé");
  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
