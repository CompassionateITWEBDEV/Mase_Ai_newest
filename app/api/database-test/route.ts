import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

type Provider = "supabase" | "neon"

type ProviderResponse = {
  status: "connected" | "degraded" | "error"
  message: string
  details: Record<string, unknown>
}

async function testSupabaseConnection(): Promise<ProviderResponse> {
  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      status: "error",
      message: "Supabase connection configuration missing",
      details: {
        checkedAt: new Date().toISOString(),
        error: "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables not found",
      },
    }
  }

  try {
    // Dynamically import to avoid build-time evaluation
    const { testDatabaseConnection } = await import("@/lib/database-test")
    
    const startTime = Date.now()
    const result = await testDatabaseConnection()
    const latencyMs = Date.now() - startTime

    if (!result.connection) {
      return {
        status: "error",
        message: "Supabase connection failed",
        details: {
          checkedAt: new Date().toISOString(),
          latencyMs,
          errors: result.errors,
          tables: result.tables,
        },
      }
    }

    const hasErrors = result.errors.length > 0
    return {
      status: hasErrors ? "degraded" : "connected",
      message: hasErrors ? "Supabase connection degraded" : "Supabase connection successful",
      details: {
        checkedAt: new Date().toISOString(),
        latencyMs,
        tables: result.tables,
        sampleDataCount: Object.keys(result.sampleData).length,
        errors: result.errors,
        features: ["auth", "database", "storage"],
      },
    }
  } catch (error) {
    return {
      status: "error",
      message: "Supabase connection test failed",
      details: {
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
    }
  }
}

async function testNeonConnection(): Promise<ProviderResponse> {
  // Check for Neon connection string in environment
  const neonConnectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

  if (!neonConnectionString) {
    return {
      status: "error",
      message: "Neon connection configuration missing",
      details: {
        checkedAt: new Date().toISOString(),
        error: "NEON_DATABASE_URL or DATABASE_URL environment variable not found",
      },
    }
  }

  try {
    const startTime = Date.now()
    const sql = neon(neonConnectionString)
    
    // Test basic connection with a simple query
    const result = await sql`SELECT 1 as test, version() as version`
    const latencyMs = Date.now() - startTime

    return {
      status: "connected",
      message: "Neon connection successful",
      details: {
        checkedAt: new Date().toISOString(),
        latencyMs,
        version: result[0]?.version,
        testQuery: result[0]?.test === 1,
        connectionString: neonConnectionString.substring(0, 20) + "***",
      },
    }
  } catch (error) {
    const latencyMs = Date.now() - Date.now()
    return {
      status: "error",
      message: "Neon connection failed",
      details: {
        checkedAt: new Date().toISOString(),
        latencyMs,
        error: error instanceof Error ? error.message : "Unknown error",
        connectionString: neonConnectionString.substring(0, 20) + "***",
      },
    }
  }
}

export async function POST(request: Request) {
  let provider: string | undefined

  try {
    const body = await request.json()
    provider = body?.provider
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid JSON payload",
        details: {},
      },
      { status: 400 },
    )
  }

  if (!provider) {
    return NextResponse.json(
      {
        status: "error",
        message: "Provider is required",
        details: {},
      },
      { status: 400 },
    )
  }

  if (provider !== "supabase" && provider !== "neon") {
    return NextResponse.json(
      {
        status: "error",
        message: `Unsupported provider: ${provider}. Supported providers: supabase, neon`,
        details: {},
      },
      { status: 400 },
    )
  }

  try {
    let response: ProviderResponse

    if (provider === "supabase") {
      response = await testSupabaseConnection()
    } else {
      response = await testNeonConnection()
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Database test failed",
        details: {
          provider,
          error: error instanceof Error ? error.message : "Unknown error",
          checkedAt: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  }
}
