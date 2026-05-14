"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales, type Locale } from "./config";

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
