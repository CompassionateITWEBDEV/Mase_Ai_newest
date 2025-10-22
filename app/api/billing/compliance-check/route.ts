import { type NextRequest, NextResponse } from "next/server"

interface ComplianceCheckRequest {
  billingRecordId?: string
  patientId?: string
  episodeId?: string
  checkType: "quick" | "full" | "custom"
  customChecks?: string[]
  includeRecommendations?: boolean
}

interface ComplianceCheckResult {
  success: boolean
  billingRecordId: string
  patientId: string
  episodeId: string
  overallScore: number
  maxPossibleScore: number
  percentageScore: number
  status: "compliant" | "non_compliant" | "warning"
  checkResults: ComplianceCheck[]
  recommendations: Recommendation[]
  missingDocuments: MissingDocument[]
  warnings: ComplianceWarning[]
  errors: ComplianceError[]
  executionTime: number
  checkedAt: string
}

interface ComplianceCheck {
  checkId: string
  category: "documentation" | "coding" | "authorization" | "eligibility" | "clinical" | "financial"
  name: string
  description: string
  required: boolean
  weight: number
  status: "pass" | "fail" | "warning" | "not_applicable"
  score: number
  maxScore: number
  details: string
  evidence?: any
  lastUpdated?: string
}

interface Recommendation {
  id: string
  priority: "high" | "medium" | "low"
  category: string
  title: string
  description: string
  actionRequired: string
  estimatedImpact: string
  dueDate?: string
}

interface MissingDocument {
  documentType: string
  description: string
  required: boolean
  category: string
  dueDate?: string
  alternativeOptions?: string[]
}

interface ComplianceWarning {
  code: string
  message: string
  category: string
  severity: "high" | "medium" | "low"
  recommendation: string
}

interface ComplianceError {
  code: string
  message: string
  category: string
  severity: "critical" | "high" | "medium"
  resolution: string
}

export async function POST(request: NextRequest) {
  try {
    const {
      billingRecordId,
      patientId,
      episodeId,
      checkType = "full",
      customChecks = [],
      includeRecommendations = true,
    }: ComplianceCheckRequest = await request.json()

    console.log(`Running ${checkType} compliance check for billing record: ${billingRecordId}`)

    const startTime = Date.now()

    // Step 1: Fetch billing record and related data
    const billingData = await fetchBillingData(billingRecordId, patientId, episodeId)
    if (!billingData) {
      return NextResponse.json(
        {
          success: false,
          message: "Billing record not found",
        },
        { status: 404 },
      )
    }

    // Step 2: Determine which checks to run
    const checksToRun = getChecksToRun(checkType, customChecks)

    // Step 3: Execute compliance checks
    const checkResults: ComplianceCheck[] = []
    const recommendations: Recommendation[] = []
    const missingDocuments: MissingDocument[] = []
    const warnings: ComplianceWarning[] = []
    const errors: ComplianceError[] = []

    for (const checkConfig of checksToRun) {
      try {
        const result = await executeComplianceCheck(checkConfig, billingData)
        checkResults.push(result)

        // Collect recommendations, missing documents, warnings, and errors
        if (result.status === "fail" || result.status === "warning") {
          const checkRecommendations = await generateRecommendations(result, billingData)
          recommendations.push(...checkRecommendations)

          const checkMissingDocs = await identifyMissingDocuments(result, billingData)
          missingDocuments.push(...checkMissingDocs)

          if (result.status === "warning") {
            warnings.push({
              code: `WARNING_${result.checkId}`,
              message: `${result.name}: ${result.details}`,
              category: result.category,
              severity: "medium",
              recommendation: `Review ${result.name.toLowerCase()} requirements`,
            })
          } else if (result.status === "fail") {
            errors.push({
              code: `ERROR_${result.checkId}`,
              message: `${result.name}: ${result.details}`,
              category: result.category,
              severity: result.required ? "critical" : "high",
              resolution: `Complete ${result.name.toLowerCase()} requirements`,
            })
          }
        }
      } catch (error) {
        console.error(`Failed to execute check ${checkConfig.id}:`, error)
        errors.push({
          code: `EXECUTION_ERROR_${checkConfig.id}`,
          message: `Failed to execute ${checkConfig.name}`,
          category: "system",
          severity: "medium",
          resolution: "Contact system administrator",
        })
      }
    }

    // Step 4: Calculate overall compliance score
    const totalScore = checkResults.reduce((sum, check) => sum + check.score, 0)
    const maxPossibleScore = checkResults.reduce((sum, check) => sum + check.maxScore, 0)
    const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

    // Step 5: Determine compliance status
    let status: "compliant" | "non_compliant" | "warning"
    if (errors.some((e) => e.severity === "critical")) {
      status = "non_compliant"
    } else if (percentageScore < 85) {
      status = "non_compliant"
    } else if (warnings.length > 0 || errors.length > 0) {
      status = "warning"
    } else {
      status = "compliant"
    }

    const endTime = Date.now()

    const result: ComplianceCheckResult = {
      success: true,
      billingRecordId: billingData.id,
      patientId: billingData.patientId,
      episodeId: billingData.episodeId,
      overallScore: totalScore,
      maxPossibleScore,
      percentageScore: Math.round(percentageScore * 100) / 100,
      status,
      checkResults,
      recommendations: includeRecommendations ? recommendations : [],
      missingDocuments,
      warnings,
      errors,
      executionTime: endTime - startTime,
      checkedAt: new Date().toISOString(),
    }

    // Step 6: Save compliance check results
    await saveComplianceCheckResults(billingData.id, result)

    // Step 7: Update billing record compliance score
    await updateBillingRecordComplianceScore(billingData.id, percentageScore, status)

    return NextResponse.json({
      success: true,
      message: "Compliance check completed successfully",
      result,
    })
  } catch (error) {
    console.error("Compliance check failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to run compliance check",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function fetchBillingData(billingRecordId?: string, patientId?: string, episodeId?: string): Promise<any> {
  // Mock billing data - in real implementation, fetch from database
  return {
    id: billingRecordId || "BR-2024-001",
    patientId: patientId || "PT-2024-001",
    episodeId: episodeId || "EP-2024-001",
    patient: {
      name: "Margaret Anderson",
      dateOfBirth: "1945-03-15",
      ssn: "123-45-6789",
      address: "123 Main Street, Springfield, IL 62701",
      insuranceInfo: {
        primary: {
          payerName: "Medicare",
          policyNumber: "1EG4-TE5-MK73",
          subscriberId: "123456789A",
        },
      },
    },
    episode: {
      admissionDate: "2024-06-15",
      dischargeDate: "2024-07-10",
      principalDiagnosis: "I63.9",
      additionalDiagnoses: ["Z51.89", "M79.3"],
      physicianOrders: true,
      planOfCare: true,
      nursingAssessment: true,
      authorizationNumber: "AUTH-789123",
      authorizationExpiry: "2024-08-15",
    },
    services: [
      { type: "skilled_nursing", visits: 8, authorized: 12 },
      { type: "physical_therapy", visits: 6, authorized: 8 },
      { type: "occupational_therapy", visits: 4, authorized: 6 },
    ],
    documents: {
      physicianOrders: { present: true, lastUpdated: "2024-06-15" },
      planOfCare: { present: true, lastUpdated: "2024-06-15" },
      nursingAssessment: { present: true, lastUpdated: "2024-06-16" },
      eligibilityVerification: { present: true, lastUpdated: "2024-06-14" },
      authorization: { present: true, lastUpdated: "2024-06-10" },
    },
    billing: {
      totalCharges: 2460.0,
      expectedReimbursement: 2091.0,
      lastBillingDate: null,
      claimStatus: "ready_to_submit",
    },
  }
}

function getChecksToRun(checkType: string, customChecks: string[]): any[] {
  const allChecks = [
    {
      id: "doc_physician_orders",
      category: "documentation",
      name: "Physician Orders",
      description: "Verify physician orders are present and current",
      required: true,
      weight: 10,
    },
    {
      id: "doc_plan_of_care",
      category: "documentation",
      name: "Plan of Care",
      description: "Verify plan of care is documented and signed",
      required: true,
      weight: 10,
    },
    {
      id: "doc_nursing_assessment",
      category: "documentation",
      name: "Nursing Assessment",
      description: "Verify initial nursing assessment is completed",
      required: true,
      weight: 8,
    },
    {
      id: "auth_verification",
      category: "authorization",
      name: "Authorization Verification",
      description: "Verify current authorization is valid",
      required: true,
      weight: 15,
    },
    {
      id: "eligibility_check",
      category: "eligibility",
      name: "Eligibility Verification",
      description: "Verify patient eligibility is current",
      required: true,
      weight: 12,
    },
    {
      id: "coding_diagnosis",
      category: "coding",
      name: "Diagnosis Coding",
      description: "Verify ICD-10 diagnosis codes are accurate",
      required: true,
      weight: 10,
    },
    {
      id: "clinical_frequency",
      category: "clinical",
      name: "Visit Frequency",
      description: "Verify visit frequency matches authorization",
      required: false,
      weight: 8,
    },
    {
      id: "financial_charges",
      category: "financial",
      name: "Charge Validation",
      description: "Verify charges are accurate and reasonable",
      required: false,
      weight: 7,
    },
  ]

  switch (checkType) {
    case "quick":
      return allChecks.filter((check) => check.required && check.weight >= 10)
    case "full":
      return allChecks
    case "custom":
      return allChecks.filter((check) => customChecks.includes(check.id))
    default:
      return allChecks
  }
}

async function executeComplianceCheck(checkConfig: any, billingData: any): Promise<ComplianceCheck> {
  console.log(`Executing compliance check: ${checkConfig.name}`)

  // Simulate check execution time
  await new Promise((resolve) => setTimeout(resolve, 50))

  let status: "pass" | "fail" | "warning" | "not_applicable" = "pass"
  let score = checkConfig.weight
  let details = "Check completed successfully"
  let evidence: any = null

  switch (checkConfig.id) {
    case "doc_physician_orders":
      if (!billingData.documents.physicianOrders.present) {
        status = "fail"
        score = 0
        details = "Physician orders are missing"
      } else {
        const orderDate = new Date(billingData.documents.physicianOrders.lastUpdated)
        const admissionDate = new Date(billingData.episode.admissionDate)
        if (orderDate > admissionDate) {
          status = "warning"
          score = checkConfig.weight * 0.8
          details = "Physician orders dated after admission"
        }
        evidence = { orderDate: billingData.documents.physicianOrders.lastUpdated }
      }
      break

    case "doc_plan_of_care":
      if (!billingData.documents.planOfCare.present) {
        status = "fail"
        score = 0
        details = "Plan of care is missing"
      } else {
        evidence = { planDate: billingData.documents.planOfCare.lastUpdated }
      }
      break

    case "doc_nursing_assessment":
      if (!billingData.documents.nursingAssessment.present) {
        status = "fail"
        score = 0
        details = "Nursing assessment is missing"
      } else {
        const assessmentDate = new Date(billingData.documents.nursingAssessment.lastUpdated)
        const admissionDate = new Date(billingData.episode.admissionDate)
        const daysDiff = Math.abs(assessmentDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)
        if (daysDiff > 2) {
          status = "warning"
          score = checkConfig.weight * 0.9
          details = "Nursing assessment completed more than 2 days after admission"
        }
        evidence = { assessmentDate: billingData.documents.nursingAssessment.lastUpdated }
      }
      break

    case "auth_verification":
      if (!billingData.episode.authorizationNumber) {
        status = "fail"
        score = 0
        details = "Authorization number is missing"
      } else {
        const authExpiry = new Date(billingData.episode.authorizationExpiry)
        const today = new Date()
        if (authExpiry < today) {
          status = "fail"
          score = 0
          details = "Authorization has expired"
        } else {
          const daysUntilExpiry = Math.ceil((authExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntilExpiry <= 7) {
            status = "warning"
            score = checkConfig.weight * 0.9
            details = `Authorization expires in ${daysUntilExpiry} days`
          }
        }
        evidence = {
          authNumber: billingData.episode.authorizationNumber,
          expiryDate: billingData.episode.authorizationExpiry,
        }
      }
      break

    case "eligibility_check":
      if (!billingData.documents.eligibilityVerification.present) {
        status = "fail"
        score = 0
        details = "Eligibility verification is missing"
      } else {
        const eligibilityDate = new Date(billingData.documents.eligibilityVerification.lastUpdated)
        const admissionDate = new Date(billingData.episode.admissionDate)
        const daysDiff = Math.abs(admissionDate.getTime() - eligibilityDate.getTime()) / (1000 * 60 * 60 * 24)
        if (daysDiff > 30) {
          status = "warning"
          score = checkConfig.weight * 0.8
          details = "Eligibility verification is more than 30 days old"
        }
        evidence = { verificationDate: billingData.documents.eligibilityVerification.lastUpdated }
      }
      break

    case "coding_diagnosis":
      if (!billingData.episode.principalDiagnosis) {
        status = "fail"
        score = 0
        details = "Principal diagnosis is missing"
      } else {
        // Simple ICD-10 format validation
        const icd10Pattern = /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/
        if (!icd10Pattern.test(billingData.episode.principalDiagnosis)) {
          status = "warning"
          score = checkConfig.weight * 0.7
          details = "Principal diagnosis code format may be invalid"
        }
        evidence = {
          principalDiagnosis: billingData.episode.principalDiagnosis,
          additionalDiagnoses: billingData.episode.additionalDiagnoses,
        }
      }
      break

    case "clinical_frequency":
      let frequencyIssues = 0
      for (const service of billingData.services) {
        if (service.visits > service.authorized) {
          frequencyIssues++
        }
      }
      if (frequencyIssues > 0) {
        status = "warning"
        score = checkConfig.weight * 0.6
        details = `${frequencyIssues} service(s) exceed authorized visits`
      }
      evidence = { services: billingData.services }
      break

    case "financial_charges":
      if (billingData.billing.totalCharges <= 0) {
        status = "fail"
        score = 0
        details = "Total charges must be greater than zero"
      } else if (billingData.billing.totalCharges > 10000) {
        status = "warning"
        score = checkConfig.weight * 0.9
        details = "Total charges are unusually high - review recommended"
      }
      evidence = { totalCharges: billingData.billing.totalCharges }
      break

    default:
      status = "not_applicable"
      score = 0
      details = "Check not implemented"
  }

  return {
    checkId: checkConfig.id,
    category: checkConfig.category,
    name: checkConfig.name,
    description: checkConfig.description,
    required: checkConfig.required,
    weight: checkConfig.weight,
    status,
    score,
    maxScore: checkConfig.weight,
    details,
    evidence,
    lastUpdated: new Date().toISOString(),
  }
}

async function generateRecommendations(checkResult: ComplianceCheck, billingData: any): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = []

  switch (checkResult.checkId) {
    case "doc_physician_orders":
      if (checkResult.status === "fail") {
        recommendations.push({
          id: `rec_${checkResult.checkId}_${Date.now()}`,
          priority: "high",
          category: "documentation",
          title: "Obtain Physician Orders",
          description: "Contact the attending physician to obtain signed orders for home health services",
          actionRequired: "Request and obtain physician orders",
          estimatedImpact: "Required for billing compliance",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
      }
      break

    case "auth_verification":
      if (checkResult.status === "fail" || checkResult.status === "warning") {
        recommendations.push({
          id: `rec_${checkResult.checkId}_${Date.now()}`,
          priority: "high",
          category: "authorization",
          title: "Renew Authorization",
          description: "Contact insurance to renew or extend authorization for continued services",
          actionRequired: "Submit authorization renewal request",
          estimatedImpact: "Prevents service interruption and billing delays",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        })
      }
      break

    case "clinical_frequency":
      if (checkResult.status === "warning") {
        recommendations.push({
          id: `rec_${checkResult.checkId}_${Date.now()}`,
          priority: "medium",
          category: "clinical",
          title: "Review Visit Frequency",
          description: "Review visit frequency and obtain additional authorization if medically necessary",
          actionRequired: "Clinical review and potential authorization request",
          estimatedImpact: "Ensures appropriate reimbursement for services",
        })
      }
      break
  }

  return recommendations
}

async function identifyMissingDocuments(checkResult: ComplianceCheck, billingData: any): Promise<MissingDocument[]> {
  const missingDocs: MissingDocument[] = []

  switch (checkResult.checkId) {
    case "doc_physician_orders":
      if (checkResult.status === "fail") {
        missingDocs.push({
          documentType: "physician_orders",
          description: "Signed physician orders for home health services",
          required: true,
          category: "clinical_documentation",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
      }
      break

    case "doc_plan_of_care":
      if (checkResult.status === "fail") {
        missingDocs.push({
          documentType: "plan_of_care",
          description: "Comprehensive plan of care signed by physician",
          required: true,
          category: "clinical_documentation",
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        })
      }
      break

    case "doc_nursing_assessment":
      if (checkResult.status === "fail") {
        missingDocs.push({
          documentType: "nursing_assessment",
          description: "Initial nursing assessment and evaluation",
          required: true,
          category: "clinical_documentation",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
      }
      break
  }

  return missingDocs
}

async function saveComplianceCheckResults(billingRecordId: string, result: ComplianceCheckResult): Promise<void> {
  console.log(`Saving compliance check results for ${billingRecordId}`)
  // In real implementation, save to database
}

async function updateBillingRecordComplianceScore(
  billingRecordId: string,
  score: number,
  status: string,
): Promise<void> {
  console.log(`Updating billing record ${billingRecordId} compliance score to ${score}% (${status})`)
  // In real implementation, update database
}

// GET - Retrieve compliance check history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const billingRecordId = searchParams.get("billingRecordId")
    const patientId = searchParams.get("patientId")
    const episodeId = searchParams.get("episodeId")

    if (!billingRecordId && !patientId && !episodeId) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one identifier (billingRecordId, patientId, or episodeId) is required",
        },
        { status: 400 },
      )
    }

    // Mock compliance check history
    const complianceHistory = [
      {
        id: "check_1",
        billingRecordId: billingRecordId || "BR-2024-001",
        checkedAt: "2024-07-10T14:30:00Z",
        checkType: "full",
        overallScore: 92,
        percentageScore: 92,
        status: "compliant",
        checksRun: 8,
        checksPassed: 7,
        checksWarning: 1,
        checksFailed: 0,
        executionTime: 1250,
      },
      {
        id: "check_2",
        billingRecordId: billingRecordId || "BR-2024-001",
        checkedAt: "2024-07-09T10:15:00Z",
        checkType: "quick",
        overallScore: 78,
        percentageScore: 78,
        status: "warning",
        checksRun: 4,
        checksPassed: 3,
        checksWarning: 0,
        checksFailed: 1,
        executionTime: 680,
      },
    ]

    return NextResponse.json({
      success: true,
      complianceHistory,
      totalChecks: complianceHistory.length,
      averageScore: complianceHistory.reduce((sum, check) => sum + check.percentageScore, 0) / complianceHistory.length,
      latestStatus: complianceHistory[0]?.status || "unknown",
    })
  } catch (error) {
    console.error("Failed to retrieve compliance check history:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve compliance check history",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
