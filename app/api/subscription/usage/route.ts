import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get user's active subscription with plan details
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 })
    }

    const plan = subscription.subscription_plans

    if (!plan) {
      return NextResponse.json({ error: "Plan details not found" }, { status: 404 })
    }

    // In a real implementation, you would query actual usage data
    // For now, we'll use mock data that represents realistic usage
    const currentUsage = {
      users: Math.floor(Math.random() * (plan.max_users === -1 ? 100 : plan.max_users * 0.8)),
      facilities: Math.floor(Math.random() * (plan.max_facilities === -1 ? 10 : plan.max_facilities * 0.6)),
      api_calls: Math.floor(Math.random() * (plan.max_api_calls === -1 ? 25000 : plan.max_api_calls * 0.7)),
      storage_gb: Math.round(Math.random() * (plan.storage_gb === -1 ? 50 : plan.storage_gb * 0.5) * 10) / 10,
    }

    // Calculate usage percentages
    const percentages = {
      users: plan.max_users === -1 ? 0 : Math.round((currentUsage.users / plan.max_users) * 100),
      facilities: plan.max_facilities === -1 ? 0 : Math.round((currentUsage.facilities / plan.max_facilities) * 100),
      api_calls: plan.max_api_calls === -1 ? 0 : Math.round((currentUsage.api_calls / plan.max_api_calls) * 100),
      storage_gb: plan.storage_gb === -1 ? 0 : Math.round((currentUsage.storage_gb / plan.storage_gb) * 100),
    }

    // Determine if any limits are approaching (>80%)
    const warnings = []
    if (percentages.users > 80) warnings.push("users")
    if (percentages.facilities > 80) warnings.push("facilities")
    if (percentages.api_calls > 80) warnings.push("api_calls")
    if (percentages.storage_gb > 80) warnings.push("storage")

    return NextResponse.json({
      plan: plan.name,
      subscription_id: subscription.id,
      period_end: subscription.current_period_end,
      limits: {
        users: plan.max_users,
        facilities: plan.max_facilities,
        api_calls: plan.max_api_calls,
        storage_gb: plan.storage_gb,
      },
      usage: currentUsage,
      percentages,
      warnings,
      features: plan.features || [],
      billing: {
        amount: plan.price,
        period: plan.billing_period,
        next_billing_date: subscription.current_period_end,
      },
    })
  } catch (error) {
    console.error("Error fetching usage data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
