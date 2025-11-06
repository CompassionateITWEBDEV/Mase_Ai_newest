import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Test endpoint to verify Supabase connection
export async function GET() {
  const startTime = Date.now()
  const tests: any[] = []

  try {
    // Test 1: Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    tests.push({
      test: "Environment Variables",
      status: supabaseUrl && supabaseServiceKey ? "✅ PASS" : "❌ FAIL",
      details: {
        url_exists: !!supabaseUrl,
        key_exists: !!supabaseServiceKey,
        url_value: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "missing"
      }
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: "Missing Supabase credentials",
        tests,
        duration: Date.now() - startTime
      }, { status: 500 })
    }

    // Test 2: Create Supabase client
    let supabase
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
      tests.push({
        test: "Client Creation",
        status: "✅ PASS",
        details: "Client created successfully"
      })
    } catch (error: any) {
      tests.push({
        test: "Client Creation",
        status: "❌ FAIL",
        error: error.message
      })
      throw error
    }

    // Test 3: Test connection with simple query
    const connectionStart = Date.now()
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("id")
        .limit(1)

      const connectionTime = Date.now() - connectionStart

      if (error) {
        tests.push({
          test: "Database Query",
          status: "❌ FAIL",
          error: error.message,
          code: error.code,
          hint: error.hint,
          duration_ms: connectionTime
        })
      } else {
        tests.push({
          test: "Database Query",
          status: "✅ PASS",
          details: `Retrieved ${data?.length || 0} records`,
          duration_ms: connectionTime
        })
      }
    } catch (error: any) {
      tests.push({
        test: "Database Query",
        status: "❌ FAIL",
        error: error.message,
        duration_ms: Date.now() - connectionStart
      })
    }

    // Test 4: Test all required tables
    const tableTests = await Promise.allSettled([
      supabase.from("staff").select("id").limit(1),
      supabase.from("in_service_completions").select("id").limit(1),
      supabase.from("in_service_enrollments").select("id").limit(1),
      supabase.from("in_service_trainings").select("id").limit(1),
      supabase.from("employee_training_requirements").select("id").limit(1),
    ])

    const tables = [
      "staff",
      "in_service_completions", 
      "in_service_enrollments",
      "in_service_trainings",
      "employee_training_requirements"
    ]

    tables.forEach((table, index) => {
      const result = tableTests[index]
      if (result.status === "fulfilled" && !result.value.error) {
        tests.push({
          test: `Table: ${table}`,
          status: "✅ PASS",
          details: `${result.value.data?.length || 0} records found`
        })
      } else {
        const error = result.status === "fulfilled" ? result.value.error : result.reason
        tests.push({
          test: `Table: ${table}`,
          status: "❌ FAIL",
          error: error?.message || "Unknown error",
          code: error?.code
        })
      }
    })

    // Test 5: Check connection pool
    tests.push({
      test: "Connection Pool",
      status: "ℹ️ INFO",
      details: {
        environment: process.env.NODE_ENV,
        runtime: "nodejs",
        vercel: !!process.env.VERCEL
      }
    })

    const totalDuration = Date.now() - startTime
    const allPassed = tests.every(t => t.status === "✅ PASS" || t.status === "ℹ️ INFO")

    return NextResponse.json({
      success: allPassed,
      summary: {
        total_tests: tests.length,
        passed: tests.filter(t => t.status === "✅ PASS").length,
        failed: tests.filter(t => t.status === "❌ FAIL").length,
        duration_ms: totalDuration
      },
      tests,
      recommendation: allPassed 
        ? "✅ Supabase is working correctly. Your issues are in the application code."
        : "❌ Supabase has issues. Check the failed tests above.",
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Test suite failed",
      details: error.message,
      tests,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

