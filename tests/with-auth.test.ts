import { describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key"
process.env.NEXT_PUBLIC_SUPABASE_ADMIN_KEY = "service-key"

vi.mock("server-only", () => ({}))

const { withAuth } = await import("../lib/with-auth")

describe("withAuth", () => {
  it("rejects missing token", async () => {
    const req = new NextRequest("http://localhost/api")
    const res = await withAuth(req, async () => NextResponse.next())
    expect(res.status).toBe(401)
  })

  it("accepts valid token in test env", async () => {
    const req = new NextRequest("http://localhost/api", {
      headers: { Authorization: "Bearer valid-token" },
    })
    const res = await withAuth(req, async (_req, user) =>
      NextResponse.json({ id: user.id }),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe("test-user")
  })
})
