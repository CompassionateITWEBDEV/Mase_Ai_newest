import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/with-auth"
import { logger } from "@/lib/logger"

interface HealthCheck {
  service: string
  status: "healthy" | "warning" | "critical"
  responseTime: number
  uptime: number
  lastCheck: string
  message?: string
}

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
  connections: number
  queue: number
}

// Simulate health checks for various services
const performHealthChecks = async (): Promise<HealthCheck[]> => {
  const services = [
    "Database Connection",
    "Axxess API",
    "Patient Portal API",
    "Billing Service",
    "Staff Management API",
    "Referral System",
    "Email Service",
    "File Storage",
  ]

  return services.map((service) => {
    // Simulate different health statuses
    const rand = Math.random()
    let status: "healthy" | "warning" | "critical"
    let responseTime: number
    let uptime: number
    let message: string | undefined

    if (rand > 0.9) {
      status = "critical"
      responseTime = Math.floor(Math.random() * 2000) + 1000
      uptime = Math.floor(Math.random() * 50) + 50
      message = "Service experiencing high latency or errors"
    } else if (rand > 0.8) {
      status = "warning"
      responseTime = Math.floor(Math.random() * 800) + 200
      uptime = Math.floor(Math.random() * 20) + 80
      message = "Service performance degraded"
    } else {
      status = "healthy"
      responseTime = Math.floor(Math.random() * 200) + 50
      uptime = Math.floor(Math.random() * 5) + 95
    }

    return {
      service,
      status,
      responseTime,
      uptime,
      lastCheck: new Date().toISOString(),
      message,
    }
  })
}

const getSystemMetrics = (): SystemMetrics => {
  return {
    cpu: Math.floor(Math.random() * 40) + 30, // 30-70%
    memory: Math.floor(Math.random() * 30) + 50, // 50-80%
    disk: Math.floor(Math.random() * 20) + 40, // 40-60%
    network: Math.floor(Math.random() * 25) + 15, // 15-40%
    connections: Math.floor(Math.random() * 500) + 100, // 100-600
    queue: Math.floor(Math.random() * 50) + 5, // 5-55
  }
}

const calculateOverallHealth = (services: HealthCheck[]): number => {
  const healthyCount = services.filter((s) => s.status === "healthy").length
  const warningCount = services.filter((s) => s.status === "warning").length
  const criticalCount = services.filter((s) => s.status === "critical").length

  const totalServices = services.length
  const healthScore = (healthyCount * 100 + warningCount * 60 + criticalCount * 20) / totalServices

  return Math.round(healthScore)
}

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const services = await performHealthChecks()
      const systemMetrics = getSystemMetrics()
      const overallHealth = calculateOverallHealth(services)

      await logger.log("monitoring", "healthcheck", "success")

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        overallHealth,
        services,
        systemMetrics,
        summary: {
          totalServices: services.length,
          healthyServices: services.filter((s) => s.status === "healthy").length,
          warningServices: services.filter((s) => s.status === "warning").length,
          criticalServices: services.filter((s) => s.status === "critical").length,
          averageResponseTime: Math.round(services.reduce((sum, s) => sum + s.responseTime, 0) / services.length),
          averageUptime: Math.round(services.reduce((sum, s) => sum + s.uptime, 0) / services.length),
        },
      })
    } catch (error) {
      await logger.log("monitoring", "healthcheck", "error", String(error))
      return NextResponse.json(
        {
          success: false,
          error: "Failed to perform health checks",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  })
}
