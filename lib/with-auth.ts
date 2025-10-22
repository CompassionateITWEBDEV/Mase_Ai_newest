import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-client"
import { logger } from "@/lib/logger"

/**
 * Wraps a route handler with Supabase authentication.
 * When running in test mode, a token value of `valid-token` is accepted
 * and no external requests are made.
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get("authorization") || ""
    if (!authHeader.startsWith("Bearer ")) {
      await logger.log(
        "auth",
        "missing_authorization",
        "error",
        "Missing or invalid authorization header",
        {
          url: request.url,
          method: request.method,
        },
      )
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Simplified auth for test environment
    if (process.env.NODE_ENV === "test") {
      if (token === "valid-token") {
        await logger.log(
          "auth",
          "test_user_authenticated",
          "success",
          "Test user authenticated",
          {
            url: request.url,
            method: request.method,
          },
        )
        return handler(request, { id: "test-user" })
      }
      await logger.log(
        "auth",
        "invalid_test_token",
        "error",
        "Invalid test token",
        {
          url: request.url,
          method: request.method,
        },
      )
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      await logger.log(
        "auth",
        "invalid_or_expired_token",
        "error",
        "Invalid or expired token",
        {
          error: error?.message,
          url: request.url,
          method: request.method,
        },
      )
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    await logger.log(
      "auth",
      "user_authenticated",
      "success",
      "User authenticated successfully",
      {
        userId: data.user.id,
        email: data.user.email,
        url: request.url,
        method: request.method,
      },
    )

    return await handler(request, data.user)
  } catch (error) {
    console.error("Authentication error:", error)
    await logger.log(
      "auth",
      "authentication_error",
      "error",
      "Authentication system error",
      {
        error: error instanceof Error ? error.message : String(error),
        url: request.url,
        method: request.method,
      },
    )
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
