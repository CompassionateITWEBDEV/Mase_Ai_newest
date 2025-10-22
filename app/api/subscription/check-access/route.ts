import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    // For build time, return a default response if no environment variables
    if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        hasAccess: true,
        plan: "basic",
        message: "Build time - no database connection",
      })
    }

    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const feature = searchParams.get("feature")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Check user subscription status
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (error) {
      console.error("Subscription check error:", error)
      return NextResponse.json({
        hasAccess: true, // Default to true for now
        plan: "basic",
        error: error.message,
      })
    }

    // Check feature access based on plan
    const hasAccess = checkFeatureAccess(subscription?.plan_id || "basic", feature)

    return NextResponse.json({
      hasAccess,
      plan: subscription?.plan_id || "basic",
      subscription,
    })
  } catch (error) {
    console.error("Subscription API error:", error)
    return NextResponse.json(
      {
        hasAccess: true, // Default to true for now
        plan: "basic",
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

function checkFeatureAccess(planId: string, feature: string | null): boolean {
  // Define feature access by plan
  const planFeatures: Record<string, string[]> = {
    basic: ["patient-tracking", "staff-dashboard", "basic-billing"],
    professional: ["patient-tracking", "staff-dashboard", "billing-center", "analytics", "integrations"],
    enterprise: ["*"], // All features
  }

  if (!feature) return true

  const allowedFeatures = planFeatures[planId] || planFeatures.basic
  return allowedFeatures.includes("*") || allowedFeatures.includes(feature)
}
