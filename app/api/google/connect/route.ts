import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { env } from "@/lib/env";
import { buildGoogleAuthUrl, googleConfigured } from "@/lib/integrations/google/oauth";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login`);
  }
  if (!googleConfigured()) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=google_not_configured`);
  }
  // state carries the user id so the callback can attribute the integration.
  return NextResponse.redirect(buildGoogleAuthUrl(user.id));
}
