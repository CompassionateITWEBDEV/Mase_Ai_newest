export interface EligibilityResponse {
  success: boolean
  patientId: string
  isEligible: boolean
  planDetails?: {
    planName: string
    groupNumber: string
    copay: {
      inNetwork: number
      outOfNetwork: number
    }
    deductible: {
      inNetwork: number
      outOfNetwork: number
      remaining: number
    }
    outOfPocketMax: {
      inNetwork: number
      outOfNetwork: number
      remaining: number
    }
  }
  message?: string
}

export interface PriorAuthResponse {
  success: boolean
  patientId: string
  priorAuthId?: string
  status: "Approved" | "Denied" | "Pending" | "More Info Required"
  message?: string
}

export interface Referral {
  id: string
  patientName: string
  referralDate: string
  referralSource: string // e.g., "Mercy Hospital", "Fax Upload", "ExtendedCare Network"
  diagnosis: string
  insuranceProvider: string
  insuranceId: string
  status: "New" | "Processing" | "Pending Auth" | "Approved" | "Denied"
  aiRecommendation?: "Approve" | "Deny" | "Review"
  aiReason?: string
  socDueDate?: string
  extendedCareData?: {
    networkId: string
    referralType: "direct" | "network" | "preferred"
    reimbursementRate: number
    contractedServices: string[]
    priorityLevel: "standard" | "urgent" | "stat"
  }
}

export interface ExtendedCareReferralRequest {
  patientName: string
  patientId: string
  diagnosis: string
  diagnosisCode: string
  insuranceProvider: string
  insuranceId: string
  requestedServices: string[]
  urgencyLevel: "routine" | "urgent" | "stat"
  referringProvider: {
    name: string
    npi: string
    facility: string
  }
  estimatedEpisodeLength: number
  geographicLocation: {
    address: string
    city: string
    state: string
    zipCode: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  specialRequirements?: string[]
  preferredStartDate?: string
}

// Mock ExtendedCare API client
class ExtendedCareAPI {
  private baseUrl = process.env.EXTENDEDCARE_API_URL || "https://api.extendedcare.com/v2"
  private apiKey = process.env.EXTENDEDCARE_API_KEY || "mock-api-key"

  async checkEligibility(patientId: string, insuranceId: string): Promise<EligibilityResponse> {
    console.log(`Checking eligibility for patient ${patientId} with insurance ${insuranceId}`)
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate network delay

    if (insuranceId.includes("INVALID")) {
      return {
        success: false,
        patientId,
        isEligible: false,
        message: "Invalid Insurance ID provided.",
      }
    }

    return {
      success: true,
      patientId,
      isEligible: true,
      planDetails: {
        planName: "Medicare Part A",
        groupNumber: "GRP-12345",
        copay: { inNetwork: 20, outOfNetwork: 50 },
        deductible: { inNetwork: 1000, outOfNetwork: 3000, remaining: 250 },
        outOfPocketMax: { inNetwork: 5000, outOfNetwork: 10000, remaining: 2500 },
      },
      message: "Patient is eligible for home health services.",
    }
  }

  async submitPriorAuth(patientId: string, serviceCodes: string[]): Promise<PriorAuthResponse> {
    console.log(`Submitting prior auth for patient ${patientId} with codes: ${serviceCodes.join(", ")}`)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return {
      success: true,
      patientId,
      priorAuthId: `PA-${Date.now()}`,
      status: "Pending",
      message: "Prior authorization request submitted successfully. Awaiting review.",
    }
  }

  async processReferral(referral: Omit<Referral, "id" | "status">): Promise<Referral> {
    console.log(`Processing referral for ${referral.patientName}`)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newReferral: Referral = {
      ...referral,
      id: `REF-${Date.now()}`,
      status: "New",
    }

    // AI-powered recommendation logic
    if (referral.diagnosis.toLowerCase().includes("palliative")) {
      newReferral.aiRecommendation = "Deny"
      newReferral.aiReason = "Palliative care not covered under standard home health benefits."
    } else if (referral.insuranceProvider.toLowerCase().includes("medicare")) {
      newReferral.aiRecommendation = "Approve"
      newReferral.aiReason = "High likelihood of approval based on diagnosis and Medicare coverage."
    } else {
      newReferral.aiRecommendation = "Review"
      newReferral.aiReason = "Manual review required for non-standard insurance provider."
    }

    return newReferral
  }

  async fetchPendingReferrals(): Promise<ExtendedCareReferralRequest[]> {
    console.log("⚠️ ExtendedCare mock data is DISABLED - returning empty array")
    await new Promise((resolve) => setTimeout(resolve, 500))

    // ⚠️ MOCK DATA DISABLED - No more James Wilson or Elizabeth Thompson!
    // This prevents automatic insertion of test data into the database
    // Return empty array instead of mock referrals
    return []

    // DISABLED MOCK REFERRALS - Uncomment only for testing
    // const mockReferrals: ExtendedCareReferralRequest[] = [
    //   {
    //     patientName: "Elizabeth Thompson",
    //     patientId: "EC-PAT-001",
    //     diagnosis: "Post-acute care following hospitalization",
    //     diagnosisCode: "Z51.89",
    //     insuranceProvider: "Medicare Advantage",
    //     insuranceId: "MA-887766",
    //     requestedServices: ["skilled_nursing", "physical_therapy"],
    //     urgencyLevel: "urgent",
    //     referringProvider: {
    //       name: "Dr. Michael Chen",
    //       npi: "1234567890",
    //       facility: "Regional Medical Center",
    //     },
    //     estimatedEpisodeLength: 45,
    //     geographicLocation: {
    //       address: "123 Oak Street",
    //       city: "Springfield",
    //       state: "IL",
    //       zipCode: "62701",
    //       coordinates: { lat: 39.7817, lng: -89.6501 },
    //     },
    //     specialRequirements: ["diabetic_care", "wound_care"],
    //     preferredStartDate: "2024-07-12",
    //   },
    //   {
    //     patientName: "James Wilson",
    //     patientId: "EC-PAT-002",
    //     diagnosis: "Chronic heart failure management",
    //     diagnosisCode: "I50.9",
    //     insuranceProvider: "Humana Gold Plus",
    //     insuranceId: "HGP-445566",
    //     requestedServices: ["skilled_nursing", "medical_social_work"],
    //     urgencyLevel: "routine",
    //     referringProvider: {
    //       name: "Dr. Sarah Martinez",
    //       npi: "0987654321",
    //       facility: "Cardiology Associates",
    //     },
    //     estimatedEpisodeLength: 60,
    //     geographicLocation: {
    //       address: "456 Maple Avenue",
    //       city: "Springfield",
    //       state: "IL",
    //       zipCode: "62702",
    //     },
    //     preferredStartDate: "2024-07-15",
    //   },
    // ]
    //
    // return mockReferrals
  }

  async acceptReferral(
    referralId: string,
    acceptanceData: {
      assignedNurse?: string
      scheduledSOC?: string
      notes?: string
    },
  ): Promise<{ success: boolean; message: string }> {
    console.log(`Accepting ExtendedCare referral ${referralId}`)
    await new Promise((resolve) => setTimeout(resolve, 800))

    return {
      success: true,
      message: "Referral accepted successfully. ExtendedCare has been notified.",
    }
  }

  async rejectReferral(referralId: string, rejectionReason: string): Promise<{ success: boolean; message: string }> {
    console.log(`Rejecting ExtendedCare referral ${referralId}: ${rejectionReason}`)
    await new Promise((resolve) => setTimeout(resolve, 600))

    return {
      success: true,
      message: "Referral rejected. ExtendedCare has been notified with the reason.",
    }
  }

  async updateReferralStatus(referralId: string, status: string, notes?: string): Promise<{ success: boolean }> {
    console.log(`Updating ExtendedCare referral ${referralId} status to ${status}`)
    await new Promise((resolve) => setTimeout(resolve, 500))

    return { success: true }
  }

  async getNetworkMetrics(): Promise<{
    totalReferrals: number
    acceptanceRate: number
    averageResponseTime: number
    reimbursementRate: number
  }> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    return {
      totalReferrals: 247,
      acceptanceRate: 0.89,
      averageResponseTime: 2.3, // hours
      reimbursementRate: 0.92,
    }
  }
}

export const extendedCareApi = new ExtendedCareAPI()
