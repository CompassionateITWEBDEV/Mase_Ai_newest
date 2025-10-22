interface EligibilityStatus {
  patientId: string
  status: "eligible" | "ineligible" | "pending" | "expired"
  insurancePlan: string
  authorizationStatus: "active" | "expiring" | "expired" | "pending"
  authorizationExpiry: Date
  deductibleMet: number
  deductibleTotal: number
  lastVerified: Date
}

interface FinancialAlert {
  id: string
  patientId: string
  type: "eligibility_lost" | "authorization_expiring" | "insurance_change" | "deductible_change" | "high_risk"
  priority: "critical" | "high" | "medium" | "low"
  message: string
  estimatedImpact: number
  actionRequired: boolean
  createdAt: Date
  resolvedAt?: Date
}

interface RiskAssessment {
  patientId: string
  riskLevel: "low" | "medium" | "high" | "critical"
  riskFactors: string[]
  financialImpact: number
  recommendations: string[]
  lastAssessed: Date
}

export class FinancialMonitoringService {
  private static instance: FinancialMonitoringService
  private monitoringActive = false
  private alertCallbacks: ((alert: FinancialAlert) => void)[] = []

  static getInstance(): FinancialMonitoringService {
    if (!FinancialMonitoringService.instance) {
      FinancialMonitoringService.instance = new FinancialMonitoringService()
    }
    return FinancialMonitoringService.instance
  }

  // Start continuous eligibility monitoring
  startMonitoring(): void {
    if (this.monitoringActive) return

    this.monitoringActive = true
    console.log("Financial monitoring started")

    // Set up periodic eligibility checks
    setInterval(
      () => {
        this.performEligibilityCheck()
      },
      5 * 60 * 1000,
    ) // Check every 5 minutes

    // Set up authorization expiry monitoring
    setInterval(
      () => {
        this.checkAuthorizationExpiry()
      },
      60 * 60 * 1000,
    ) // Check every hour

    // Set up risk assessment updates
    setInterval(
      () => {
        this.updateRiskAssessments()
      },
      15 * 60 * 1000,
    ) // Update every 15 minutes
  }

  stopMonitoring(): void {
    this.monitoringActive = false
    console.log("Financial monitoring stopped")
  }

  // Register callback for alert notifications
  onAlert(callback: (alert: FinancialAlert) => void): void {
    this.alertCallbacks.push(callback)
  }

  // Trigger alert notifications
  private triggerAlert(alert: FinancialAlert): void {
    this.alertCallbacks.forEach((callback) => callback(alert))

    // Send notifications based on priority
    this.sendNotification(alert)
  }

  // Perform eligibility verification for all active patients
  private async performEligibilityCheck(): Promise<void> {
    try {
      console.log("Performing eligibility check...")

      // In a real implementation, this would:
      // 1. Query active patients from database
      // 2. Call insurance verification APIs
      // 3. Compare with previous status
      // 4. Generate alerts for changes

      const mockChanges = this.simulateEligibilityChanges()

      for (const change of mockChanges) {
        if (change.requiresAlert) {
          this.triggerAlert(change.alert)
        }
      }
    } catch (error) {
      console.error("Error during eligibility check:", error)
    }
  }

  // Check for expiring authorizations
  private async checkAuthorizationExpiry(): Promise<void> {
    try {
      console.log("Checking authorization expiry...")

      // Mock authorization expiry check
      const expiringAuthorizations = this.getExpiringAuthorizations()

      for (const auth of expiringAuthorizations) {
        const alert: FinancialAlert = {
          id: `auth_exp_${Date.now()}_${auth.patientId}`,
          patientId: auth.patientId,
          type: "authorization_expiring",
          priority: this.getExpiryPriority(auth.daysUntilExpiry),
          message: `Authorization expires in ${auth.daysUntilExpiry} days`,
          estimatedImpact: auth.episodeValue,
          actionRequired: true,
          createdAt: new Date(),
        }

        this.triggerAlert(alert)
      }
    } catch (error) {
      console.error("Error checking authorization expiry:", error)
    }
  }

  // Update risk assessments for all patients
  private async updateRiskAssessments(): Promise<void> {
    try {
      console.log("Updating risk assessments...")

      // Mock risk assessment update
      const riskUpdates = this.calculateRiskAssessments()

      for (const assessment of riskUpdates) {
        if (assessment.riskLevel === "critical" || assessment.riskLevel === "high") {
          const alert: FinancialAlert = {
            id: `risk_${Date.now()}_${assessment.patientId}`,
            patientId: assessment.patientId,
            type: "high_risk",
            priority: assessment.riskLevel === "critical" ? "critical" : "high",
            message: `Patient risk level: ${assessment.riskLevel}`,
            estimatedImpact: assessment.financialImpact,
            actionRequired: true,
            createdAt: new Date(),
          }

          this.triggerAlert(alert)
        }
      }
    } catch (error) {
      console.error("Error updating risk assessments:", error)
    }
  }

  // Send notifications based on alert priority
  private async sendNotification(alert: FinancialAlert): Promise<void> {
    try {
      const notificationData = {
        alertId: alert.id,
        patientId: alert.patientId,
        priority: alert.priority,
        message: alert.message,
        estimatedImpact: alert.estimatedImpact,
      }

      // Send email notification
      if (alert.priority === "critical" || alert.priority === "high") {
        await fetch("/api/notifications/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "financial_alert",
            priority: alert.priority,
            data: notificationData,
          }),
        })
      }

      // Send SMS for critical alerts
      if (alert.priority === "critical") {
        await fetch("/api/notifications/sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "critical_financial_alert",
            data: notificationData,
          }),
        })
      }
    } catch (error) {
      console.error("Error sending notification:", error)
    }
  }

  // Mock functions for demonstration
  private simulateEligibilityChanges() {
    return [
      {
        patientId: "123",
        previousStatus: "eligible",
        currentStatus: "ineligible",
        requiresAlert: true,
        alert: {
          id: `elig_${Date.now()}`,
          patientId: "123",
          type: "eligibility_lost" as const,
          priority: "critical" as const,
          message: "Patient eligibility lost - Insurance plan terminated",
          estimatedImpact: 15000,
          actionRequired: true,
          createdAt: new Date(),
        },
      },
    ]
  }

  private getExpiringAuthorizations() {
    return [
      {
        patientId: "456",
        authorizationId: "AUTH123",
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 7,
        episodeValue: 12500,
      },
    ]
  }

  private getExpiryPriority(daysUntilExpiry: number): "critical" | "high" | "medium" | "low" {
    if (daysUntilExpiry <= 3) return "critical"
    if (daysUntilExpiry <= 7) return "high"
    if (daysUntilExpiry <= 14) return "medium"
    return "low"
  }

  private calculateRiskAssessments(): RiskAssessment[] {
    return [
      {
        patientId: "789",
        riskLevel: "high",
        riskFactors: ["Authorization expiring soon", "High deductible remaining"],
        financialImpact: 18000,
        recommendations: ["Renew authorization immediately", "Verify patient financial assistance options"],
        lastAssessed: new Date(),
      },
    ]
  }

  // Public methods for manual operations
  async triggerManualEligibilityCheck(patientId: string): Promise<boolean> {
    try {
      console.log(`Manual eligibility check for patient ${patientId}`)
      // Implementation would call insurance verification API
      return true
    } catch (error) {
      console.error("Manual eligibility check failed:", error)
      return false
    }
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      console.log(`Resolving alert ${alertId}`)
      // Implementation would update alert status in database
      await fetch("/api/notifications/resolve-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, resolvedAt: new Date().toISOString() }),
      })
      return true
    } catch (error) {
      console.error("Failed to resolve alert:", error)
      return false
    }
  }

  async generateFinancialReport(timeframe = "30d"): Promise<any> {
    try {
      console.log(`Generating financial report for ${timeframe}`)

      const response = await fetch(`/api/financial-dashboard/metrics?timeframe=${timeframe}&projections=true`)
      const data = await response.json()

      return {
        reportId: `report_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        timeframe,
        data: data.data,
        summary: {
          totalRevenue: data.data.summary.projectedReimbursement,
          atRiskAmount: data.data.summary.atRiskAmount,
          reimbursementRate: data.data.summary.reimbursementRate,
          criticalAlerts: data.data.alerts.critical.count,
        },
      }
    } catch (error) {
      console.error("Failed to generate financial report:", error)
      throw error
    }
  }

  // Calculate financial impact of resolving specific alerts
  calculateImpactOfResolution(alerts: FinancialAlert[]): number {
    return alerts.reduce((total, alert) => {
      // Positive impact for resolving negative alerts
      if (alert.estimatedImpact > 0) {
        return total + alert.estimatedImpact
      }
      return total
    }, 0)
  }

  // Get recommended actions for financial optimization
  getRecommendedActions(): Array<{
    action: string
    priority: "high" | "medium" | "low"
    estimatedImpact: number
    timeToComplete: string
  }> {
    return [
      {
        action: "Renew expiring authorizations",
        priority: "high",
        estimatedImpact: 125000,
        timeToComplete: "1-2 days",
      },
      {
        action: "Verify insurance for pending patients",
        priority: "high",
        estimatedImpact: 100800,
        timeToComplete: "2-3 days",
      },
      {
        action: "Follow up on denied claims",
        priority: "medium",
        estimatedImpact: 75000,
        timeToComplete: "1-2 weeks",
      },
      {
        action: "Update patient financial information",
        priority: "medium",
        estimatedImpact: 45000,
        timeToComplete: "3-5 days",
      },
      {
        action: "Optimize care plans for high-risk patients",
        priority: "low",
        estimatedImpact: 25000,
        timeToComplete: "2-4 weeks",
      },
    ]
  }
}

// Export singleton instance
export const financialMonitoring = FinancialMonitoringService.getInstance()

// Utility functions for financial calculations
export function calculateReimbursementRate(projectedReimbursement: number, totalEpisodeValue: number): number {
  if (totalEpisodeValue === 0) return 0
  return (projectedReimbursement / totalEpisodeValue) * 100
}

export function calculateRiskLevel(
  eligibilityStatus: string,
  authorizationStatus: string,
  daysUntilExpiry: number,
  deductibleRemaining: number,
): "low" | "medium" | "high" | "critical" {
  if (eligibilityStatus === "ineligible" || authorizationStatus === "expired") {
    return "critical"
  }

  if (authorizationStatus === "expiring" && daysUntilExpiry <= 7) {
    return "high"
  }

  if (daysUntilExpiry <= 14 || deductibleRemaining > 5000) {
    return "medium"
  }

  return "low"
}

export function formatFinancialImpact(impact: number): string {
  const absImpact = Math.abs(impact)
  const sign = impact >= 0 ? "+" : "-"

  return `${sign}$${absImpact.toLocaleString()}`
}

export function getPriorityFromImpact(impact: number): "critical" | "high" | "medium" | "low" {
  const absImpact = Math.abs(impact)

  if (absImpact >= 50000) return "critical"
  if (absImpact >= 20000) return "high"
  if (absImpact >= 5000) return "medium"
  return "low"
}
