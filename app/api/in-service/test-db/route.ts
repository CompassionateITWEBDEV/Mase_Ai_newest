import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: "Missing Supabase environment variables",
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const results: any = {
      connection: true,
      tables: {},
      errors: [],
    }

    // Test each table
    const tables = [
      "in_service_trainings",
      "in_service_enrollments",
      "in_service_completions",
      "in_service_assignments",
      "employee_training_requirements",
    ]

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*").limit(1)
        
        if (error) {
          results.errors.push(`${table}: ${error.message} (code: ${error.code})`)
          results.tables[table] = { exists: false, error: error.message, code: error.code }
        } else {
          results.tables[table] = { exists: true, count: "unknown", sample: data }
        }
      } catch (err: any) {
        results.errors.push(`${table}: ${err.message}`)
        results.tables[table] = { exists: false, error: err.message }
      }
    }

    // Test insert on trainings table
    try {
      const testData = {
        training_code: `TEST-${Date.now()}`,
        title: "Test Training",
        category: "Clinical Skills",
        type: "online_course",
        duration: 60,
        ceu_hours: 1.0,
        description: "Test description",
        target_roles: ["All"],
        difficulty: "Basic",
        status: "draft",
      }

      const { data: insertData, error: insertError } = await supabase
        .from("in_service_trainings")
        .insert(testData)
        .select()
        .single()

      if (insertError) {
        results.insertTest = { success: false, error: insertError.message, code: insertError.code }
      } else {
        // Delete the test record
        await supabase.from("in_service_trainings").delete().eq("id", insertData.id)
        results.insertTest = { success: true, message: "Insert and delete successful" }
      }
    } catch (err: any) {
      results.insertTest = { success: false, error: err.message }
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      stack: error.stack,
    })
  }
}

