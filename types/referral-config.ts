export interface ReferralConfiguration {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  geographic: {
    maxTravelDistance: number
    excludedZipCodes: string[]
    preferredZipCodes: string[]
    serviceAreas: string[]
  }
  insurance: {
    acceptedTypes: {
      medicare: boolean
      medicaid: boolean
      commercial: boolean
      managedCare: boolean
      selfPay: boolean
    }
    excludedProviders: string[]
    requirePriorAuth: string[]
    minimumCopay: number
    maximumCopay: number
  }
  clinical: {
    acceptedDiagnoses: string[]
    excludedDiagnoses: string[]
    requiredServices: string[]
    excludedServices: string[]
    maxEpisodeLength: number
    minEpisodeLength: number
    urgencyHandling: {
      routine: "accept" | "review" | "reject"
      urgent: "accept" | "review" | "reject"
      stat: "accept" | "review" | "reject"
    }
  }
  capacity: {
    maxDailyReferrals: number
    maxWeeklyReferrals: number
    nurseCaseloadLimit: number
    therapistCaseloadLimit: number
    weekendAcceptance: boolean
    holidayAcceptance: boolean
  }
  quality: {
    minimumHospitalRating: number
    preferredReferralSources: string[]
    excludedReferralSources: string[]
    requirePhysicianOrders: boolean
    requireInsuranceVerification: boolean
  }
  notifications: {
    notifyMSWOnReject: boolean
    notifyMSWOnReview: boolean
    notifyMSWOnAccept: boolean
    autoAssignIntake: boolean
    escalationTimeHours: number
  }
  scoring: {
    geographicWeight: number
    insuranceWeight: number
    clinicalWeight: number
    capacityWeight: number
    qualityWeight: number
    minimumAcceptanceScore: number
  }
}

export interface ReferralDecisionFactors {
  geographic: {
    score: number
    distance: number
    inServiceArea: boolean
    notes: string[]
  }
  insurance: {
    score: number
    type: string
    accepted: boolean
    priorAuthRequired: boolean
    notes: string[]
  }
  clinical: {
    score: number
    diagnosisMatch: boolean
    serviceMatch: boolean
    episodeLengthOk: boolean
    notes: string[]
  }
  capacity: {
    score: number
    withinLimits: boolean
    availableStaff: boolean
    notes: string[]
  }
  quality: {
    score: number
    sourceRating: number
    meetsStandards: boolean
    notes: string[]
  }
  overall: {
    totalScore: number
    weightedScore: number
    recommendation: "accept" | "review" | "reject"
    confidence: number
  }
}
