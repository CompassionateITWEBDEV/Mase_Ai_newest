import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/auth/patient-login",
  "/auth/patient-forgot-password",
  "/survey-login",
  "/survey-dashboard",
  "/patient-portal",
  "/patient-portal/onboarding",
  "/patient-portal-enhanced",
  "/doctor-portal",
  "/facility-portal",
  "/integrations",
  "/integrations/axxess-setup",
  "/integrations/extendedcare-setup",
  "/integrations/change-healthcare-setup",
  "/integrations/availity-setup",
  "/integrations/caqh-setup",
  "/integrations/sterling-setup",
  "/integrations/twilio-setup",
  "/integrations/sendgrid-setup",
  "/integrations/vonage-setup",
  "/integrations/teams-setup",
  "/integrations/stripe-setup",
  "/integrations/quickbooks-setup",
  "/integrations/docusign-setup",
  "/integrations/paypal-setup",
  "/integrations/supabase-setup",
  "/integrations/vercel-setup",
  "/integrations/aws-setup",
  "/integrations/cloudflare-setup",
  "/api/integrations",
  "/api/integrations/axxess",
  "/api/integrations/extendedcare",
  "/api/integrations/change-healthcare",
  "/api/integrations/availity",
  "/api/integrations/caqh",
  "/api/integrations/sterling",
  "/api/integrations/twilio",
  "/api/integrations/sendgrid",
  "/api/integrations/vonage",
  "/api/integrations/teams",
  "/api/integrations/stripe",
  "/api/integrations/quickbooks",
  "/api/integrations/docusign",
  "/api/integrations/paypal",
  "/api/integrations/supabase",
  "/api/integrations/vercel",
  "/api/integrations/aws",
  "/api/integrations/cloudflare",
  "/api/axxess",
  "/api/extendedcare",
  "/api/change-healthcare",
  "/api/availity",
  "/api/caqh",
  "/api/sterling",
  "/api/twilio",
  "/api/sendgrid",
  "/api/vonage",
  "/api/teams",
  "/api/stripe",
  "/api/quickbooks",
  "/api/docusign",
  "/api/paypal",
  "/api/supabase",
  "/api/vercel",
  "/api/aws",
  "/api/cloudflare",
]

// Define API routes that should always be accessible
const API_ROUTES = [
  "/api/auth",
  "/api/webhooks",
  "/api/integrations",
  "/api/axxess",
  "/api/extendedcare",
  "/api/change-healthcare",
  "/api/availity",
  "/api/caqh",
  "/api/sterling",
  "/api/twilio",
  "/api/sendgrid",
  "/api/vonage",
  "/api/teams",
  "/api/stripe",
  "/api/quickbooks",
  "/api/docusign",
  "/api/paypal",
  "/api/supabase",
  "/api/vercel",
  "/api/aws",
  "/api/cloudflare",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all API routes
  if (API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // For now, allow all other routes (remove this in production with proper auth)
  return NextResponse.next()

  // In production, you would check authentication here:
  // const token = request.cookies.get('auth-token')
  // if (!token) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }
  // return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
