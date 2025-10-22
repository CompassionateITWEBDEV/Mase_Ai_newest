export interface EligibilityMonitorConfig {
  patientId: string
  insuranceProvider: string
  insuranceId: string
  checkFrequency: "daily" | "weekly" | "monthly"
  alertThresholds: {
    deductibleRemaining: number
    outOfPocketRemaining: number
    daysUntilExpiration: number
  }
  notifications: {
    email: string[]
    sms: string[]
    webhook?: string
  }
}

export interface EligibilityAlert {
  id: string
  patientId: string
  patientName: string
  type: "eligibility_lost" | "insurance_changed" | "benefits_reduced" | "expiration_warning" | "deductible_met"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  timestamp: string
  actionRequired: boolean
  recommendations: string[]
  financialImpact?: {
    estimatedLoss: number
    affectedServices: string[]
    reimbursementChange: number
  }
  changes?: {
    previous: any
    current: any
  }
}

export class EligibilityMonitor {
  private monitoringConfigs: Map<string, EligibilityMonitorConfig> = new Map()
  private alertHistory: EligibilityAlert[] = []

  addPatientMonitoring(config: EligibilityMonitorConfig) {
    this.monitoringConfigs.set(config.patientId, config)
    console.log(`Started monitoring eligibility for patient ${config.patientId}`)
  }

  removePatientMonitoring(patientId: string) {
    this.monitoringConfigs.delete(patientId)
    console.log(`Stopped monitoring eligibility for patient ${patientId}`)
  }

  async checkAllPatients(): Promise<EligibilityAlert[]> {
    const alerts: EligibilityAlert[] = []

    for (const [patientId, config] of this.monitoringConfigs) {
      try {
        const patientAlerts = await this.checkPatientEligibility(patientId, config)
        alerts.push(...patientAlerts)
      } catch (error) {
        console.error(`Failed to check eligibility for patient ${patientId}:`, error)
      }
    }

    return alerts
  }

  private async checkPatientEligibility(
    patientId: string,
    config: EligibilityMonitorConfig,
  ): Promise<EligibilityAlert[]> {
    const alerts: EligibilityAlert[] = []

    // Simulate eligibility check
    const currentEligibility = await this.performEligibilityCheck(patientId, config.insuranceId)
    const previousEligibility = this.getPreviousEligibility(patientId)

    // Check for eligibility loss
    if (previousEligibility?.isEligible && !currentEligibility.isEligible) {
      alerts.push({
        id: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        patientId,
        patientName: `Patient ${patientId}`,
        type: "eligibility_lost",
        severity: "critical",
        message: `Patient has lost insurance eligibility. Immediate action required.`,
        timestamp: new Date().toISOString(),
        actionRequired: true,
        recommendations: [
          "Contact patient immediately to verify insurance status",
          "Request updated insurance cards and information",
          "Consider discharge planning if eligibility cannot be restored",
          "Document all communication attempts",
          "Notify billing department of potential uncollectable charges",
        ],
        financialImpact: {
          estimatedLoss: 15000, // Estimated episode cost
          affectedServices: ["skilled_nursing", "physical_therapy", "medical_social_work"],
          reimbursementChange: -1.0, // 100% loss
        },
      })
    }

    // Check for plan changes
    if (previousEligibility?.planDetails && currentEligibility.planDetails) {
      const prevPlan = previousEligibility.planDetails
      const currPlan = currentEligibility.planDetails

      if (prevPlan.planName !== currPlan.planName) {
        const reimbursementImpact = this.calculateReimbursementImpact(prevPlan, currPlan)

        alerts.push({
          id: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          patientId,
          patientName: `Patient ${patientId}`,
          type: "insurance_changed",
          severity: reimbursementImpact < -0.1 ? "high" : "medium",
          message: `Insurance plan changed. Review coverage and reimbursement impact.`,
          timestamp: new Date().toISOString(),
          actionRequired: true,
          recommendations: [
            "Verify new plan covers all current services",
            "Check if existing prior authorizations remain valid",
            "Update billing information and fee schedules",
            "Confirm patient copay and deductible responsibilities",
            "Review service frequency limits under new plan",
          ],
          changes: {
            previous: { plan: prevPlan.planName, group: prevPlan.groupNumber },
            current: { plan: currPlan.planName, group: currPlan.groupNumber },
          },
          financialImpact: {
            estimatedLoss: reimbursementImpact * 12000, // Estimated episode value
            affectedServices: ["skilled_nursing"],
            reimbursementChange: reimbursementImpact,
          },
        })
      }
    }

    // Check deductible and out-of-pocket thresholds
    if (currentEligibility.planDetails) {
      const { deductible, outOfPocketMax } = currentEligibility.planDetails

      if (deductible.remaining <= config.alertThresholds.deductibleRemaining) {
        alerts.push({
          id: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          patientId,
          patientName: `Patient ${patientId}`,
          type: "deductible_met",
          severity: "low",
          message: `Patient's deductible is nearly met. Improved reimbursement expected.`,
          timestamp: new Date().toISOString(),
          actionRequired: false,
          recommendations: [
            "Consider scheduling additional medically necessary services",
            "Ensure all services are properly documented",
            "Verify patient understands reduced out-of-pocket costs",
          ],
          financialImpact: {
            estimatedLoss: 0,
            affectedServices: [],
            reimbursementChange: 0.15, // 15% improvement in reimbursement
          },
        })
      }
    }

    return alerts
  }

  private async performEligibilityCheck(patientId: string, insuranceId: string) {
    // Simulate API call to insurance provider
    await new Promise((resolve) => setTimeout(resolve, 200))

    return {
      isEligible: Math.random() > 0.05, // 95% chance of being eligible
      planDetails: {
        planName: Math.random() > 0.9 ? "Medicare Part B" : "Medicare Part A", // 10% chance of plan change
        groupNumber: "GRP-12345",
        copay: { inNetwork: 20, outOfNetwork: 50 },
        deductible: {
          inNetwork: 1000,
          outOfNetwork: 3000,
          remaining: Math.floor(Math.random() * 500), // Random remaining deductible
        },
        outOfPocketMax: {
          inNetwork: 5000,
          outOfNetwork: 10000,
          remaining: Math.floor(Math.random() * 3000),
        },
      },
      lastVerified: new Date().toISOString(),
    }
  }

  private getPreviousEligibility(patientId: string) {
    // In a real implementation, this would fetch from database
    return {
      isEligible: true,
      planDetails: {
        planName: "Medicare Part A",
        groupNumber: "GRP-12345",
      },
    }
  }

  private calculateReimbursementImpact(previousPlan: any, currentPlan: any): number {
    // Simplified reimbursement calculation
    // In reality, this would use complex fee schedules and contract rates

    const planReimbursementRates: Record<string, number> = {
      "Medicare Part A": 0.85,
      "Medicare Part B": 0.8,
      "Medicare Advantage": 0.9,
      Medicaid: 0.7,
      Commercial: 0.95,
    }

    const prevRate = planReimbursementRates[previousPlan.planName] || 0.8
    const currRate = planReimbursementRates[currentPlan.planName] || 0.8

    return currRate - prevRate
  }

  getAlertHistory(): EligibilityAlert[] {
    return this.alertHistory
  }

  async sendAlert(alert: EligibilityAlert, config: EligibilityMonitorConfig) {
    // Send notifications based on configuration
    if (config.notifications.email.length > 0) {
      await this.sendEmailAlert(alert, config.notifications.email)
    }

    if (config.notifications.sms.length > 0) {
      await this.sendSMSAlert(alert, config.notifications.sms)
    }

    if (config.notifications.webhook) {
      await this.sendWebhookAlert(alert, config.notifications.webhook)
    }

    this.alertHistory.push(alert)
  }

  private async sendEmailAlert(alert: EligibilityAlert, emails: string[]) {
    // Implementation for email alerts
    console.log(`Sending email alert to ${emails.join(", ")}:`, alert.message)
  }

  private async sendSMSAlert(alert: EligibilityAlert, phones: string[]) {
    // Implementation for SMS alerts
    console.log(`Sending SMS alert to ${phones.join(", ")}:`, alert.message)
  }

  private async sendWebhookAlert(alert: EligibilityAlert, webhookUrl: string) {
    // Implementation for webhook alerts
    console.log(`Sending webhook alert to ${webhookUrl}:`, alert)
  }
}

export const eligibilityMonitor = new EligibilityMonitor()
