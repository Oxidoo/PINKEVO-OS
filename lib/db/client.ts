import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pinkevoDb: ReturnType<typeof drizzle> | undefined;
  // eslint-disable-next-line no-var
  var __pinkevoSql: ReturnType<typeof postgres> | undefined;
}

const sql =
  globalThis.__pinkevoSql ??
  postgres(env.DATABASE_URL, {
    max: 10,
    prepare: false,
  });

export const db = globalThis.__pinkevoDb ?? drizzle(sql, { schema, casing: "snake_case" });

// Cache connection globally so warm serverless invocations reuse it.
globalThis.__pinkevoSql ??= sql;
globalThis.__pinkevoDb ??= db;

export type Db = typeof db;
