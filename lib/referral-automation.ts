export interface ReferralData {
  patientName: string
  diagnosis: string
  insuranceProvider: string
  insuranceId: string
  referralSource: string
  serviceRequested: string[]
  urgency: "routine" | "urgent" | "stat"
  estimatedEpisodeLength: number
  geographicLocation: {
    address: string
    zipCode: string
    distance: number
  }
  hospitalRating: number
  physicianOrders: boolean
}

export interface ReferralDecision {
  action: "accept" | "review" | "reject"
  reason: string
  confidence: number
  factors: {
    geographic: number
    insurance: number
    clinical: number
    capacity: number
    quality: number
  }
  recommendedNextSteps: string[]
  estimatedResponseTime: string
  assignedMSW?: string
}

// Default configuration - in a real app, this would come from the database
const defaultConfig = {
  geographicRules: {
    maxDistance: 25,
    preferredZipCodes: ["12345", "12346", "12347"],
    excludedZipCodes: ["99999"],
  },
  insuranceRules: {
    acceptedTypes: ["medicare", "medicaid", "blue cross", "aetna", "humana"],
    excludedProviders: ["denied insurance co"],
    requirePriorAuth: false,
  },
  clinicalRules: {
    excludedDiagnoses: ["terminal cancer", "hospice appropriate"],
    requiredServices: [],
    maxEpisodeLength: 120,
  },
  capacityRules: {
    maxDailyReferrals: 10,
    maxWeeklyReferrals: 50,
    maxStaffCaseload: 25,
    weekendProcessing: true,
    holidayProcessing: false,
  },
  qualityRules: {
    minHospitalRating: 3,
    preferredReferralSources: ["trusted hospital", "preferred clinic"],
  },
  scoringWeights: {
    geographic: 0.2,
    insurance: 0.25,
    clinical: 0.25,
    capacity: 0.15,
    quality: 0.15,
  },
  urgencyHandling: {
    routine: { autoAccept: true, reviewThreshold: 0.7 },
    urgent: { autoAccept: true, reviewThreshold: 0.6 },
    stat: { autoAccept: false, reviewThreshold: 0.5 },
  },
}

export interface AutomationDecision {
  action: "accept" | "review" | "reject"
  reason: string
  confidence: number
  factors: {
    geographic: number
    insurance: number
    clinical: number
    capacity: number
    quality: number
  }
  recommendedNextSteps: string[]
  estimatedResponseTime: string
  assignedMSW?: string
}

export async function runReferralAutomation(referralData: ReferralData): Promise<ReferralResult> {
  try {
    console.log(`Processing referral for ${referralData.patientName}`)

    // Generate unique referral ID
    const referralId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Calculate decision factors
    const factors = await calculateDecisionFactors(referralData)

    // Calculate overall score
    const overallScore = calculateOverallScore(factors)

    // Make decision based on score and urgency
    const decision = makeReferralDecision(referralData, factors, overallScore)

    // Log the decision
    console.log(
      `Referral ${referralId} decision: ${decision.action} (confidence: ${Math.round(decision.confidence * 100)}%)`,
    )

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    return {
      success: true,
      referralId,
      decision,
      message: `Referral processed successfully with ${decision.action} decision`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Referral automation error:", error)

    return {
      success: false,
      referralId: `ERROR-${Date.now()}`,
      message: `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date().toISOString(),
    }
  }
}

async function calculateDecisionFactors(referralData: ReferralData) {
  // Geographic factor
  const geographic = calculateGeographicScore(referralData.geographicLocation)

  // Insurance factor
  const insurance = calculateInsuranceScore(referralData.insuranceProvider)

  // Clinical factor
  const clinical = calculateClinicalScore(
    referralData.diagnosis,
    referralData.serviceRequested,
    referralData.estimatedEpisodeLength,
  )

  // Capacity factor
  const capacity = await calculateCapacityScore(referralData.urgency)

  // Quality factor
  const quality = calculateQualityScore(referralData.hospitalRating, referralData.referralSource)

  return { geographic, insurance, clinical, capacity, quality }
}

function calculateGeographicScore(location: ReferralData["geographicLocation"]): number {
  const { distance, zipCode } = location
  const { maxDistance, preferredZipCodes, excludedZipCodes } = defaultConfig.geographicRules

  // Check excluded zip codes
  if (excludedZipCodes.includes(zipCode)) {
    return 0
  }

  // Bonus for preferred zip codes
  let score = preferredZipCodes.includes(zipCode) ? 1.0 : 0.8

  // Distance penalty
  if (distance > maxDistance) {
    score *= 0.3 // Significant penalty for being too far
  } else {
    score *= Math.max(0.5, 1 - (distance / maxDistance) * 0.5)
  }

  return Math.max(0, Math.min(1, score))
}

function calculateInsuranceScore(insuranceProvider: string): number {
  const { acceptedTypes, excludedProviders } = defaultConfig.insuranceRules

  const provider = insuranceProvider.toLowerCase()

  // Check excluded providers
  if (excludedProviders.some((excluded) => provider.includes(excluded.toLowerCase()))) {
    return 0
  }

  // Check accepted types
  const isAccepted = acceptedTypes.some((accepted) => provider.includes(accepted.toLowerCase()))

  if (isAccepted) {
    // Higher score for preferred insurance types
    if (provider.includes("medicare")) return 1.0
    if (provider.includes("blue cross")) return 0.95
    if (provider.includes("aetna") || provider.includes("humana")) return 0.9
    if (provider.includes("medicaid")) return 0.8
    return 0.85
  }

  return 0.3 // Low score for unknown insurance
}

function calculateClinicalScore(diagnosis: string, services: string[], episodeLength: number): number {
  const { excludedDiagnoses, maxEpisodeLength } = defaultConfig.clinicalRules

  const diagnosisLower = diagnosis.toLowerCase()

  // Check excluded diagnoses
  if (excludedDiagnoses.some((excluded) => diagnosisLower.includes(excluded.toLowerCase()))) {
    return 0
  }

  let score = 0.8 // Base score

  // Episode length factor
  if (episodeLength > maxEpisodeLength) {
    score *= 0.5 // Penalty for very long episodes
  } else if (episodeLength <= 30) {
    score *= 1.1 // Bonus for shorter episodes
  }

  // Service complexity factor
  const complexServices = ["iv_therapy", "wound_care", "ventilator"]
  const hasComplexServices = services.some((service) => complexServices.includes(service))

  if (hasComplexServices) {
    score *= 0.9 // Slight penalty for complex services
  }

  return Math.max(0, Math.min(1, score))
}

async function calculateCapacityScore(urgency: ReferralData["urgency"]): Promise<number> {
  const { maxDailyReferrals, weekendProcessing, holidayProcessing } = defaultConfig.capacityRules

  // Simulate current capacity check
  const currentHour = new Date().getHours()
  const isWeekend = [0, 6].includes(new Date().getDay())
  const isHoliday = false // Would check against holiday calendar

  let score = 0.8 // Base capacity score

  // Time-based adjustments
  if (isWeekend && !weekendProcessing) {
    score *= 0.3
  }

  if (isHoliday && !holidayProcessing) {
    score *= 0.2
  }

  // After hours penalty (except for STAT)
  if ((currentHour < 8 || currentHour > 17) && urgency !== "stat") {
    score *= 0.7
  }

  // Urgency bonus
  if (urgency === "stat") {
    score *= 1.2
  } else if (urgency === "urgent") {
    score *= 1.1
  }

  // Simulate current caseload (would query database in real implementation)
  const currentDailyReferrals = Math.floor(Math.random() * maxDailyReferrals)
  const capacityUtilization = currentDailyReferrals / maxDailyReferrals

  if (capacityUtilization > 0.9) {
    score *= 0.5 // Significant penalty when near capacity
  } else if (capacityUtilization > 0.7) {
    score *= 0.8 // Moderate penalty when busy
  }

  return Math.max(0, Math.min(1, score))
}

function calculateQualityScore(hospitalRating: number, referralSource: string): number {
  const { minHospitalRating, preferredReferralSources } = defaultConfig.qualityRules

  let score = 0.8 // Base score

  // Hospital rating factor
  if (hospitalRating < minHospitalRating) {
    score *= 0.5
  } else {
    score *= hospitalRating / 5 // Scale based on rating
  }

  // Preferred source bonus
  const isPreferredSource = preferredReferralSources.some((preferred) =>
    referralSource.toLowerCase().includes(preferred.toLowerCase()),
  )

  if (isPreferredSource) {
    score *= 1.2
  }

  return Math.max(0, Math.min(1, score))
}

function calculateOverallScore(factors: ReferralDecision["factors"]): number {
  const weights = defaultConfig.scoringWeights

  return (
    factors.geographic * weights.geographic +
    factors.insurance * weights.insurance +
    factors.clinical * weights.clinical +
    factors.capacity * weights.capacity +
    factors.quality * weights.quality
  )
}

function makeReferralDecision(
  referralData: ReferralData,
  factors: ReferralDecision["factors"],
  overallScore: number,
): ReferralDecision {
  const urgencyConfig = defaultConfig.urgencyHandling[referralData.urgency]
  const { autoAccept, reviewThreshold } = urgencyConfig

  let action: ReferralDecision["action"]
  let reason: string
  const confidence = overallScore

  // Decision logic based on score and urgency
  if (overallScore >= 0.8) {
    action = "accept"
    reason = "High confidence match - all criteria met"
  } else if (overallScore >= reviewThreshold) {
    if (autoAccept && referralData.urgency !== "stat") {
      action = "accept"
      reason = "Acceptable match - meets minimum criteria"
    } else {
      action = "review"
      reason = "Requires manual review - moderate confidence"
    }
  } else {
    action = "reject"
    reason = "Does not meet acceptance criteria"
  }

  // Override for STAT referrals
  if (referralData.urgency === "stat" && overallScore >= 0.5) {
    action = "review"
    reason = "STAT referral - requires immediate review"
  }

  // Generate recommended next steps
  const recommendedNextSteps = generateNextSteps(action, referralData, factors)

  // Estimate response time
  const estimatedResponseTime = getEstimatedResponseTime(action, referralData.urgency)

  return {
    action,
    reason,
    confidence,
    factors,
    recommendedNextSteps,
    estimatedResponseTime,
    assignedMSW: action === "review" ? "MSW Team" : undefined,
  }
}

function generateNextSteps(
  action: ReferralDecision["action"],
  referralData: ReferralData,
  factors: ReferralDecision["factors"],
): string[] {
  const steps: string[] = []

  switch (action) {
    case "accept":
      steps.push("Schedule Start of Care within 48 hours")
      steps.push("Assign primary nurse based on location and services")
      steps.push("Verify insurance benefits and authorization")
      steps.push("Contact patient/family to coordinate first visit")
      if (referralData.urgency === "stat") {
        steps.unshift("Expedite SOC - schedule within 24 hours")
      }
      break

    case "review":
      steps.push("MSW team will review within 4 hours")
      steps.push("May require additional documentation")
      steps.push("Will contact referring facility with decision")
      if (factors.insurance < 0.5) {
        steps.push("Verify insurance coverage and benefits")
      }
      if (factors.capacity < 0.5) {
        steps.push("Check staff availability and capacity")
      }
      break

    case "reject":
      steps.push("Send rejection notice to referring facility")
      steps.push("Provide reason for rejection")
      if (factors.geographic < 0.5) {
        steps.push("Suggest alternative agencies in patient area")
      }
      if (factors.insurance < 0.5) {
        steps.push("Recommend insurance verification")
      }
      break
  }

  return steps
}

function getEstimatedResponseTime(action: ReferralDecision["action"], urgency: ReferralData["urgency"]): string {
  if (urgency === "stat") {
    return action === "accept" ? "Within 2 hours" : "Within 1 hour"
  } else if (urgency === "urgent") {
    return action === "accept" ? "Within 4 hours" : "Within 2 hours"
  } else {
    return action === "accept" ? "Within 24 hours" : "Within 8 hours"
  }
}

export interface ReferralResult {
  success: boolean
  referralId: string
  decision?: ReferralDecision
  message: string
  timestamp: string
}
