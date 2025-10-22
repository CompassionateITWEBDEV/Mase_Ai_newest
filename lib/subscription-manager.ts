import { supabase } from "./supabase-client"

export const SUBSCRIPTION_PLANS = {
  starter: {
    name: "Starter",
    price: 99,
    billing_period: "monthly" as const,
    features: [
      "Basic Dashboard",
      "Staff Management",
      "Basic Reporting",
      "Email Support",
      "Up to 50 Users",
      "Basic Training Modules",
    ],
    max_users: 50,
    max_facilities: 5,
    max_api_calls: 10000,
    storage_gb: 10,
  },
  professional: {
    name: "Professional",
    price: 299,
    billing_period: "monthly" as const,
    features: [
      "Advanced Analytics",
      "Quality Assurance Tools",
      "Financial Dashboard",
      "Advanced Reporting",
      "Priority Support",
      "Up to 200 Users",
      "Advanced Training & Certification",
      "GPS Tracking",
      "Supply Management",
    ],
    max_users: 200,
    max_facilities: 20,
    max_api_calls: 50000,
    storage_gb: 100,
  },
  enterprise: {
    name: "Enterprise",
    price: 799,
    billing_period: "monthly" as const,
    features: [
      "All Professional Features",
      "Advanced Billing & Claims",
      "Predictive Analytics",
      "AI-Powered Insights",
      "Custom Integrations",
      "Dedicated Support",
      "Unlimited Users",
      "Advanced Security",
      "Custom Workflows",
      "API Access",
    ],
    max_users: -1,
    max_facilities: -1,
    max_api_calls: -1,
    storage_gb: -1,
  },
}

export const DASHBOARD_ACCESS_REQUIREMENTS = {
  // Basic dashboards - available to all plans
  "/": "starter",
  "/staff-dashboard": "starter",
  "/applications": "starter",
  "/schedule": "starter",
  "/training": "starter",
  "/communications": "starter",
  "/documents": "starter",

  // Professional dashboards
  "/analytics": "professional",
  "/quality": "professional",
  "/financial-dashboard": "professional",
  "/patient-reviews": "professional",
  "/gps-analytics": "professional",
  "/wound-care-supplies": "professional",
  "/continuing-education": "professional",
  "/in-service": "professional",
  "/physicians": "professional",
  "/marketing-dashboard": "professional",
  "/facility-portal": "professional",

  // Enterprise dashboards
  "/advanced-billing": "enterprise",
  "/predictive-analytics": "enterprise",
  "/predictive-marketing": "enterprise",
  "/billing-automation": "enterprise",
  "/mobile-billing": "enterprise",
  "/ai-competency": "enterprise",
  "/automated-outreach": "enterprise",
  "/mihin-integration": "enterprise",
  "/integrations": "enterprise",
  "/admin/users": "enterprise",
}

export async function getUserSubscription(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (error) {
      console.error("Error fetching user subscription:", error)
      return null
    }
    return data
  } catch (error) {
    console.error("Error in getUserSubscription:", error)
    return null
  }
}

export async function getSubscriptionPlans() {
  try {
    const { data, error } = await supabase.from("subscription_plans").select("*").order("price", { ascending: true })

    if (error) {
      console.error("Error fetching subscription plans:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("Error in getSubscriptionPlans:", error)
    return []
  }
}

export async function hasAccessToDashboard(userId: string, dashboardPath: string): Promise<boolean> {
  try {
    const userSubscription = await getUserSubscription(userId)
    if (!userSubscription) return false

    const requiredPlan = DASHBOARD_ACCESS_REQUIREMENTS[dashboardPath as keyof typeof DASHBOARD_ACCESS_REQUIREMENTS]
    if (!requiredPlan) return true // No restriction

    const planHierarchy = { starter: 1, professional: 2, enterprise: 3 }
    const userPlanLevel =
      planHierarchy[userSubscription.subscription_plans.name.toLowerCase() as keyof typeof planHierarchy]
    const requiredPlanLevel = planHierarchy[requiredPlan as keyof typeof planHierarchy]

    return userPlanLevel >= requiredPlanLevel
  } catch (error) {
    console.error("Error checking dashboard access:", error)
    return false
  }
}

export async function getSubscriptionLimits(userId: string) {
  try {
    const userSubscription = await getUserSubscription(userId)
    if (!userSubscription) return null

    const plan = userSubscription.subscription_plans

    // Mock current usage data - in production, this would come from actual usage tracking
    const currentUsage = {
      users: Math.floor(Math.random() * (plan.max_users === -1 ? 100 : plan.max_users * 0.8)),
      facilities: Math.floor(Math.random() * (plan.max_facilities === -1 ? 10 : plan.max_facilities * 0.6)),
      api_calls: Math.floor(Math.random() * (plan.max_api_calls === -1 ? 25000 : plan.max_api_calls * 0.7)),
      storage_gb: Math.round(Math.random() * (plan.storage_gb === -1 ? 50 : plan.storage_gb * 0.5) * 10) / 10,
    }

    return {
      plan: plan.name,
      limits: {
        users: plan.max_users,
        facilities: plan.max_facilities,
        api_calls: plan.max_api_calls,
        storage_gb: plan.storage_gb,
      },
      usage: currentUsage,
      percentages: {
        users: plan.max_users === -1 ? 0 : Math.round((currentUsage.users / plan.max_users) * 100),
        facilities: plan.max_facilities === -1 ? 0 : Math.round((currentUsage.facilities / plan.max_facilities) * 100),
        api_calls: plan.max_api_calls === -1 ? 0 : Math.round((currentUsage.api_calls / plan.max_api_calls) * 100),
        storage_gb: plan.storage_gb === -1 ? 0 : Math.round((currentUsage.storage_gb / plan.storage_gb) * 100),
      },
    }
  } catch (error) {
    console.error("Error getting subscription limits:", error)
    return null
  }
}

// Create a demo subscription for testing
export async function createDemoSubscription(userId: string, planName = "professional") {
  try {
    // Get the plan
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("name", planName)
      .single()

    if (planError || !plan) {
      console.error("Plan not found:", planError)
      return null
    }

    // Create subscription
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (subError) {
      console.error("Error creating subscription:", subError)
      return null
    }

    return subscription
  } catch (error) {
    console.error("Error in createDemoSubscription:", error)
    return null
  }
}
