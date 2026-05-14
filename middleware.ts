import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - api/inngest, api/stripe/webhook, api/telegram/webhook, api/cal/webhook (public webhooks)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/inngest|api/stripe/webhook|api/telegram/webhook|api/cal/webhook).*)",
  ],
};
