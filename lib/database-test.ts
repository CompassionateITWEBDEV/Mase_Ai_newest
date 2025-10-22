import { supabase } from "./supabase-client"

export interface DatabaseTestResult {
  connection: boolean
  tables: string[]
  sampleData: any
  errors: string[]
}

export async function testDatabaseConnection(): Promise<DatabaseTestResult> {
  const result: DatabaseTestResult = {
    connection: false,
    tables: [],
    sampleData: {},
    errors: [],
  }

  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    result.errors.push("Supabase environment variables not configured")
    return result
  }

  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from("subscription_plans")
      .select("count")
      .limit(1)

    if (connectionError) {
      result.errors.push(`Connection error: ${connectionError.message}`)
      return result
    }

    result.connection = true

    // Test all tables
    const tables = ["subscription_plans", "user_subscriptions", "dashboard_access"]

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*").limit(5)

        if (error) {
          result.errors.push(`Table ${table} error: ${error.message}`)
        } else {
          result.tables.push(table)
          result.sampleData[table] = data
        }
      } catch (err) {
        result.errors.push(`Table ${table} exception: ${err}`)
      }
    }

    return result
  } catch (error) {
    result.errors.push(`General error: ${error}`)
    return result
  }
}

export async function ensureTestData() {
  try {
    // Check if subscription plans exist
    const { data: plans, error: plansError } = await supabase.from("subscription_plans").select("*")

    if (plansError) {
      console.error("Error checking plans:", plansError)
      return false
    }

    // If no plans exist, create them
    if (!plans || plans.length === 0) {
      const testPlans = [
        {
          name: "Starter",
          price: 99,
          billing_period: "monthly",
          max_users: 50,
          max_facilities: 5,
          max_api_calls: 10000,
          storage_gb: 10,
          features: ["Basic Dashboard", "Staff Management", "Basic Reporting"],
        },
        {
          name: "Professional",
          price: 299,
          billing_period: "monthly",
          max_users: 200,
          max_facilities: 20,
          max_api_calls: 50000,
          storage_gb: 100,
          features: ["Advanced Analytics", "Quality Assurance", "Financial Dashboard"],
        },
        {
          name: "Enterprise",
          price: 799,
          billing_period: "monthly",
          max_users: -1,
          max_facilities: -1,
          max_api_calls: -1,
          storage_gb: -1,
          features: ["All Features", "Custom Integrations", "Dedicated Support"],
        },
      ]

      const { error: insertError } = await supabase.from("subscription_plans").insert(testPlans)

      if (insertError) {
        console.error("Error inserting test plans:", insertError)
        return false
      }
    }

    // Check dashboard access data
    const { data: dashboards, error: dashboardError } = await supabase.from("dashboard_access").select("*")

    if (dashboardError) {
      console.error("Error checking dashboards:", dashboardError)
      return false
    }

    // If no dashboard access rules exist, create them
    if (!dashboards || dashboards.length === 0) {
      const dashboardRules = [
        {
          dashboard_name: "Analytics",
          dashboard_path: "/analytics",
          required_plan: "professional",
          is_premium: true,
          description: "Advanced analytics and reporting",
        },
        {
          dashboard_name: "Advanced Billing",
          dashboard_path: "/advanced-billing",
          required_plan: "enterprise",
          is_premium: true,
          description: "Advanced billing and claims management",
        },
        {
          dashboard_name: "Predictive Analytics",
          dashboard_path: "/predictive-analytics",
          required_plan: "enterprise",
          is_premium: true,
          description: "AI-powered predictive analytics",
        },
      ]

      const { error: dashboardInsertError } = await supabase.from("dashboard_access").insert(dashboardRules)

      if (dashboardInsertError) {
        console.error("Error inserting dashboard rules:", dashboardInsertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error ensuring test data:", error)
    return false
  }
}
