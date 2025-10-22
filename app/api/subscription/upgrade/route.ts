import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { userId, planName } = await request.json()

    if (!userId || !planName) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get the new plan details
    const { data: newPlan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("name", planName)
      .single()

    if (planError || !newPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Cancel existing subscription
    const { error: cancelError } = await supabase
      .from("user_subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .eq("status", "active")

    if (cancelError) {
      console.error("Error cancelling existing subscription:", cancelError)
    }

    // Create new subscription
    const { data: newSubscription, error: createError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_id: newPlan.id,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating new subscription:", createError)
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
    }

    // In a real implementation, you would integrate with Stripe here
    // const stripeSession = await stripe.checkout.sessions.create({...})

    return NextResponse.json({
      success: true,
      subscription: newSubscription,
      plan: newPlan,
      message: `Successfully upgraded to ${planName} plan`,
    })
  } catch (error) {
    console.error("Error upgrading subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
