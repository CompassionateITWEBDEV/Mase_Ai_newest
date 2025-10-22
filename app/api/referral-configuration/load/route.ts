import { type NextRequest, NextResponse } from "next/server"
import type { ReferralConfiguration } from "@/types/referral-config"

// Default configuration for testing
const defaultConfiguration: ReferralConfiguration = {
  id: "default",
  name: "Default Configuration",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  geographic: {
    maxTravelDistance: 25,
    excludedZipCodes: [],
    preferredZipCodes: [],
    serviceAreas: [],
  },
  insurance: {
    acceptedTypes: {
      medicare: true,
      medicaid: true,
      commercial: true,
      managedCare: true,
      selfPay: false,
    },
    excludedProviders: [],
    requirePriorAuth: ["Aetna Better Health", "Molina Healthcare"],
    minimumCopay: 0,
    maximumCopay: 100,
  },
  clinical: {
    acceptedDiagnoses: [],
    excludedDiagnoses: ["hospice", "palliative", "experimental"],
    requiredServices: ["skilled_nursing"],
    excludedServices: ["ventilator_care"],
    maxEpisodeLength: 120,
    minEpisodeLength: 7,
    urgencyHandling: {
      routine: "accept",
      urgent: "accept",
      stat: "review",
    },
  },
  capacity: {
    maxDailyReferrals: 15,
    maxWeeklyReferrals: 75,
    nurseCaseloadLimit: 25,
    therapistCaseloadLimit: 30,
    weekendAcceptance: false,
    holidayAcceptance: false,
  },
  quality: {
    minimumHospitalRating: 3,
    preferredReferralSources: ["Memorial Hospital", "St. Mary's Medical Center"],
    excludedReferralSources: [],
    requirePhysicianOrders: true,
    requireInsuranceVerification: true,
  },
  notifications: {
    notifyMSWOnReject: true,
    notifyMSWOnReview: true,
    notifyMSWOnAccept: false,
    autoAssignIntake: true,
    escalationTimeHours: 4,
  },
  scoring: {
    geographicWeight: 0.2,
    insuranceWeight: 0.25,
    clinicalWeight: 0.3,
    capacityWeight: 0.15,
    qualityWeight: 0.1,
    minimumAcceptanceScore: 0.75,
  },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get("id") || "default"

    // In a real implementation, this would load from database
    // For now, return the default configuration
    const config = configId === "default" ? defaultConfiguration : null

    if (!config) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error("Configuration load error:", error)
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
  }
}
