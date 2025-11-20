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

// ExtendedCare API client with database-backed credentials
class ExtendedCareAPI {
  private baseUrl = process.env.EXTENDEDCARE_API_URL || "https://api.extendedcare.com/v2"
  private credentials: {
    username: string
    password: string
    clientId?: string
    environment: string
  } | null = null
  private accessToken: string | null = null
  private tokenExpiry: number | null = null

  /**
   * Load credentials from database configuration
   */
  async loadCredentials(): Promise<boolean> {
    try {
      const response = await fetch("/api/integrations/extendedcare/config")
      const result = await response.json()

      if (result.success && result.configured) {
        this.credentials = {
          username: result.config.username,
          password: "", // Password not sent to frontend, will use server-side auth
          clientId: result.config.clientId,
          environment: result.config.environment || "production",
        }

        // Update baseUrl based on environment
        if (this.credentials.environment === "sandbox") {
          this.baseUrl = "https://api.extendedcare.com/sandbox/v2"
        } else {
          this.baseUrl = "https://api.extendedcare.com/v2"
        }

        return true
      }

      console.warn("ExtendedCare credentials not configured")
      return false
    } catch (error) {
      console.error("Failed to load ExtendedCare credentials:", error)
      return false
    }
  }

  /**
   * Authenticate with ExtendedCare API
   */
  private async authenticate(): Promise<boolean> {
    // Check if we have valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return true
    }

    // For client-side calls, we need to go through our API
    // which has access to the full credentials
    try {
      const response = await fetch("/api/integrations/extendedcare/authenticate", {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        this.accessToken = result.accessToken
        this.tokenExpiry = Date.now() + (result.expiresIn * 1000)
        return true
      }

      console.error("ExtendedCare authentication failed:", result.message)
      return false
    } catch (error) {
      console.error("ExtendedCare authentication error:", error)
      return false
    }
  }

  /**
   * Set credentials directly (for server-side use)
   */
  setCredentials(credentials: {
    username: string
    password: string
    clientId?: string
    environment?: string
  }) {
    this.credentials = {
      username: credentials.username,
      password: credentials.password,
      clientId: credentials.clientId,
      environment: credentials.environment || "production",
    }

    // Update baseUrl based on environment
    if (this.credentials.environment === "sandbox") {
      this.baseUrl = "https://api.extendedcare.com/sandbox/v2"
    } else {
      this.baseUrl = "https://api.extendedcare.com/v2"
    }
  }

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
    console.log("📥 Fetching pending referrals from ExtendedCare Network...")

    // Use server-side API endpoint to fetch referrals (has access to credentials)
    try {
      const response = await fetch("/api/integrations/extendedcare/fetch-referrals", {
        method: "GET",
      })

      const result = await response.json()

      if (result.success) {
        console.log(`✅ Retrieved ${result.referrals.length} referrals from ExtendedCare`)
        return result.referrals
      } else {
        console.error("Failed to fetch ExtendedCare referrals:", result.message)
        return []
      }
    } catch (error) {
      console.error("Error fetching ExtendedCare referrals:", error)
      return []
    }
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
