import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

interface PerformanceMetric {
  timestamp: string
  responseTime: number
  requests: number
  errors: number
  cpu: number
  memory: number
}

interface EndpointMetric {
  endpoint: string
  avgResponseTime: number
  requestCount: number
  errorRate: number
  p95ResponseTime: number
  p99ResponseTime: number
}

const generateHistoricalData = (timeRange: string): PerformanceMetric[] => {
  const now = new Date()
  const data: PerformanceMetric[] = []

  let intervals: number
  let intervalMinutes: number

  switch (timeRange) {
    case "1h":
      intervals = 12 // 5-minute intervals
      intervalMinutes = 5
      break
    case "6h":
      intervals = 36 // 10-minute intervals
      intervalMinutes = 10
      break
    case "12h":
      intervals = 48 // 15-minute intervals
      intervalMinutes = 15
      break
    case "24h":
      intervals = 48 // 30-minute intervals
      intervalMinutes = 30
      break
    case "7d":
      intervals = 168 // 1-hour intervals
      intervalMinutes = 60
      break
    default:
      intervals = 12
      intervalMinutes = 5
  }

  for (let i = intervals; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000)

    // Generate realistic metrics with some variation
    const baseResponseTime = 200 + Math.sin(i * 0.1) * 50
    const baseRequests = 100 + Math.sin(i * 0.2) * 30
    const baseCpu = 45 + Math.sin(i * 0.15) * 15
    const baseMemory = 65 + Math.sin(i * 0.12) * 10

    data.push({
      timestamp: timestamp.toISOString(),
      responseTime: Math.max(50, baseResponseTime + (Math.random() - 0.5) * 100),
      requests: Math.max(10, baseRequests + (Math.random() - 0.5) * 50),
      errors: Math.floor(Math.random() * 5),
      cpu: Math.max(10, Math.min(90, baseCpu + (Math.random() - 0.5) * 20)),
      memory: Math.max(30, Math.min(85, baseMemory + (Math.random() - 0.5) * 15)),
    })
  }

  return data
}

const generateEndpointMetrics = (): EndpointMetric[] => {
  const endpoints = [
    "/api/patients",
    "/api/staff",
    "/api/billing",
    "/api/referrals",
    "/api/auth",
    "/api/notifications",
    "/api/analytics",
    "/api/integrations",
  ]

  return endpoints.map((endpoint) => ({
    endpoint,
    avgResponseTime: Math.floor(Math.random() * 300) + 100,
    requestCount: Math.floor(Math.random() * 1000) + 100,
    errorRate: Math.random() * 2, // 0-2%
    p95ResponseTime: Math.floor(Math.random() * 800) + 400,
    p99ResponseTime: Math.floor(Math.random() * 1500) + 800,
  }))
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get("timeRange") || "1h"
    const type = searchParams.get("type") || "all"

    const performance = generateHistoricalData(timeRange)
    const endpoints = generateEndpointMetrics()

    // Calculate summary statistics
    const totalRequests = performance.reduce((sum, p) => sum + p.requests, 0)
    const totalErrors = performance.reduce((sum, p) => sum + p.errors, 0)
    const avgResponseTime = performance.reduce((sum, p) => sum + p.responseTime, 0) / performance.length
    const avgCpu = performance.reduce((sum, p) => sum + p.cpu, 0) / performance.length
    const avgMemory = performance.reduce((sum, p) => sum + p.memory, 0) / performance.length

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      timeRange,
      performance,
      endpoints,
      summary: {
        totalRequests: Math.round(totalRequests),
        totalErrors: Math.round(totalErrors),
        errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : "0.00",
        avgResponseTime: Math.round(avgResponseTime),
        avgCpu: Math.round(avgCpu),
        avgMemory: Math.round(avgMemory),
        dataPoints: performance.length,
      },
    }

    // Filter by type if specified
    if (type !== "all") {
      switch (type) {
        case "responseTime":
          return NextResponse.json({
            ...response,
            data: performance.map((p) => ({ timestamp: p.timestamp, value: p.responseTime })),
          })
        case "requests":
          return NextResponse.json({
            ...response,
            data: performance.map((p) => ({ timestamp: p.timestamp, value: p.requests })),
          })
        case "errors":
          return NextResponse.json({
            ...response,
            data: performance.map((p) => ({ timestamp: p.timestamp, value: p.errors })),
          })
        case "cpu":
          return NextResponse.json({
            ...response,
            data: performance.map((p) => ({ timestamp: p.timestamp, value: p.cpu })),
          })
        case "memory":
          return NextResponse.json({
            ...response,
            data: performance.map((p) => ({ timestamp: p.timestamp, value: p.memory })),
          })
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to fetch metrics:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch performance metrics",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
