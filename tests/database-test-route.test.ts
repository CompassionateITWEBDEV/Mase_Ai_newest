import { describe, expect, it, beforeAll } from "vitest"

import { POST } from "../app/api/database-test/route"

const createRequest = (provider: string) =>
  new Request("http://localhost/api/database-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  })

describe("/api/database-test", () => {
  // Test basic functionality with supabase and neon providers
  it.each([
    ["supabase", "Supabase"],
    ["neon", "Neon"],
  ])("returns response for %s provider", async (provider, expectedProviderName) => {
    const response = await POST(createRequest(provider))
    expect(response.status).toBe(200)

    const data = await response.json()
    // Should have valid response structure
    expect(data).toHaveProperty("status")
    expect(data).toHaveProperty("message")
    expect(data).toHaveProperty("details")
    expect(data.details).toHaveProperty("checkedAt")
    
    // Message should contain provider name
    expect(data.message).toContain(expectedProviderName)
    
    // Status should be one of the valid values
    expect(["connected", "degraded", "error"]).toContain(data.status)
  })

  it("returns error for invalid provider", async () => {
    const response = await POST(createRequest("invalid-provider"))
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.status).toBe("error")
    expect(data.message).toContain("Unsupported provider")
  })

  it("returns error for missing provider", async () => {
    const request = new Request("http://localhost/api/database-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    
    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.status).toBe("error")
    expect(data.message).toContain("Provider is required")
  })

  it("returns error for invalid JSON", async () => {
    const request = new Request("http://localhost/api/database-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    })
    
    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.status).toBe("error")
    expect(data.message).toBe("Invalid JSON payload")
  })
})
