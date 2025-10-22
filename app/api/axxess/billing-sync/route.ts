import { type NextRequest, NextResponse } from "next/server"

interface AxxessBillingData {
  patientId: string
  axxessId: string
  episodeId: string
  episodeStartDate: string
  episodeEndDate?: string
  totalCharges: number
  visitData: VisitRecord[]
  insuranceInfo: InsuranceInfo
  authorizationInfo: AuthorizationInfo
  complianceData: ComplianceData
  billingStatus: string
  lastBillingDate?: string
  outstandingBalance: number
  paymentHistory: PaymentRecord[]
  financialAnalytics: FinancialAnalytics
  revenueBreakdown: RevenueBreakdown
  costAnalysis: CostAnalysis
  profitabilityMetrics: ProfitabilityMetrics
}

interface VisitRecord {
  visitId: string
  visitDate: string
  serviceCode: string
  serviceDescription: string
  discipline: "RN" | "LPN" | "PT" | "OT" | "ST" | "MSW" | "HHA"
  nurseId: string
  nurseName: string
  duration: number
  units: number
  unitCharge: number
  totalCharge: number
  modifier?: string
  placeOfService: string
  diagnosisCode: string
  notes?: string
  supervisingPhysician: string
  authorizationNumber?: string
  complianceFlags: string[]
  billingStatus: "billable" | "non_billable" | "pending_review" | "billed" | "paid" | "denied"
  reimbursementAmount?: number
  denialReason?: string
  paymentDate?: string
}

interface InsuranceInfo {
  primaryInsurance: {
    payerId: string
    payerName: string
    policyNumber: string
    groupNumber?: string
    subscriberId: string
    relationshipToSubscriber: string
    effectiveDate: string
    terminationDate?: string
    reimbursementRate: number
    contractType: "fee_for_service" | "managed_care" | "value_based"
  }
  secondaryInsurance?: {
    payerId: string
    payerName: string
    policyNumber: string
    groupNumber?: string
    subscriberId: string
    relationshipToSubscriber: string
    effectiveDate: string
    terminationDate?: string
    reimbursementRate: number
  }
  eligibilityVerified: boolean
  lastEligibilityCheck: string
  copayAmount: number
  deductibleAmount: number
  deductibleMet: number
  outOfPocketMax: number
  outOfPocketMet: number
  priorAuthRequired: boolean
  benefitsPeriod: string
  coverageLimitations: string[]
}

interface AuthorizationInfo {
  authorizationNumber: string
  authorizationDate: string
  effectiveDate: string
  expirationDate: string
  authorizedServices: string[]
  authorizedUnits: Record<string, number>
  usedUnits: Record<string, number>
  remainingUnits: Record<string, number>
  authorizingPhysician: string
  status: "active" | "expired" | "pending" | "denied"
  renewalRequired: boolean
  renewalDate?: string
  authorizationValue: number
  utilizationRate: number
}

interface ComplianceData {
  pocSigned: boolean
  pocSignatureDate?: string
  face2FaceCompleted: boolean
  face2FaceDate?: string
  initialAssessmentCompleted: boolean
  initialAssessmentDate?: string
  requiredDocuments: DocumentStatus[]
  lupaStatus: "safe" | "at_risk" | "over_threshold"
  lupaThresholds: Record<string, number>
  qualityMeasures: QualityMeasure[]
  complianceScore: number
  riskLevel: "low" | "medium" | "high" | "critical"
  complianceIssues: ComplianceIssue[]
  auditReadiness: number
}

interface DocumentStatus {
  documentType: string
  required: boolean
  received: boolean
  receivedDate?: string
  expirationDate?: string
  status: "current" | "expired" | "missing"
  impactOnReimbursement: number
}

interface QualityMeasure {
  measureId: string
  measureName: string
  target: number
  actual: number
  status: "met" | "not_met" | "pending"
  impactOnReimbursement: number
  category: "process" | "outcome" | "structure"
}

interface ComplianceIssue {
  issueId: string
  issueType: string
  severity: "critical" | "high" | "medium" | "low"
  description: string
  financialImpact: number
  resolutionRequired: boolean
  dueDate?: string
}

interface PaymentRecord {
  paymentId: string
  paymentDate: string
  amount: number
  paymentMethod: string
  referenceNumber: string
  adjustments: Adjustment[]
  payerName: string
  checkNumber?: string
  eraNumber?: string
  remittanceAdvice?: string
  processingTime: number
  paymentStatus: "processed" | "pending" | "rejected"
}

interface Adjustment {
  adjustmentCode: string
  adjustmentReason: string
  amount: number
  adjustmentType: "contractual" | "administrative" | "other"
}

interface FinancialAnalytics {
  revenuePerVisit: number
  costPerVisit: number
  profitPerVisit: number
  marginPerVisit: number
  reimbursementTrend: TrendData[]
  costTrend: TrendData[]
  profitabilityTrend: TrendData[]
  benchmarkComparison: BenchmarkData
}

interface RevenueBreakdown {
  insuranceRevenue: number
  patientRevenue: number
  otherRevenue: number
  totalRevenue: number
  revenueByService: Record<string, number>
  revenueByPayer: Record<string, number>
  revenueByMonth: Record<string, number>
}

interface CostAnalysis {
  directCosts: number
  indirectCosts: number
  totalCosts: number
  costByService: Record<string, number>
  costByDiscipline: Record<string, number>
  costPerEpisode: number
  costVariance: number
}

interface ProfitabilityMetrics {
  grossProfit: number
  netProfit: number
  grossMargin: number
  netMargin: number
  ebitda: number
  roi: number
  paybackPeriod: number
  breakEvenPoint: number
}

interface TrendData {
  period: string
  value: number
  change: number
  changePercent: number
}

interface BenchmarkData {
  industryAverage: number
  topQuartile: number
  bottomQuartile: number
  percentileRank: number
}

export async function POST(request: NextRequest) {
  try {
    const {
      includeVisitData = true,
      includeBillingData = true,
      includePaymentHistory = true,
      includeFinancialAnalytics = true,
      dateRange = "30d",
    } = await request.json()

    console.log("Starting comprehensive Axxess billing sync with full financial data...")

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Mock comprehensive billing data from Axxess with full financial details
    const mockBillingData: AxxessBillingData[] = [
      {
        patientId: "PT-2024-004",
        axxessId: "AX-12348",
        episodeId: "EP-789123",
        episodeStartDate: "2024-06-01",
        episodeEndDate: "2024-07-10",
        totalCharges: 15750.0,
        visitData: [
          {
            visitId: "V-001",
            visitDate: "2024-06-01",
            serviceCode: "G0154",
            serviceDescription: "Direct skilled nursing services of a registered nurse",
            discipline: "RN",
            nurseId: "RN-001",
            nurseName: "Patricia Wilson",
            duration: 60,
            units: 1,
            unitCharge: 125.0,
            totalCharge: 125.0,
            placeOfService: "12",
            diagnosisCode: "I63.9",
            supervisingPhysician: "Dr. Sarah Thompson",
            authorizationNumber: "AUTH-789123",
            complianceFlags: [],
            billingStatus: "paid",
            reimbursementAmount: 112.5,
            paymentDate: "2024-07-02",
          },
          {
            visitId: "V-002",
            visitDate: "2024-06-01",
            serviceCode: "G0151",
            serviceDescription: "Services of physical therapist in home health setting",
            discipline: "PT",
            nurseId: "PT-001",
            nurseName: "Michael Rodriguez",
            duration: 45,
            units: 1,
            unitCharge: 150.0,
            totalCharge: 150.0,
            placeOfService: "12",
            diagnosisCode: "I63.9",
            supervisingPhysician: "Dr. Sarah Thompson",
            authorizationNumber: "AUTH-789123",
            complianceFlags: [],
            billingStatus: "paid",
            reimbursementAmount: 135.0,
            paymentDate: "2024-07-02",
          },
        ],
        insuranceInfo: {
          primaryInsurance: {
            payerId: "00431",
            payerName: "Medicare",
            policyNumber: "1EG4-TE5-MK73",
            subscriberId: "123456789A",
            relationshipToSubscriber: "self",
            effectiveDate: "2024-01-01",
            reimbursementRate: 90.0,
            contractType: "fee_for_service",
          },
          eligibilityVerified: true,
          lastEligibilityCheck: "2024-07-10T08:00:00Z",
          copayAmount: 0,
          deductibleAmount: 1632,
          deductibleMet: 1632,
          outOfPocketMax: 0,
          outOfPocketMet: 0,
          priorAuthRequired: true,
          benefitsPeriod: "2024",
          coverageLimitations: [],
        },
        authorizationInfo: {
          authorizationNumber: "AUTH-789123",
          authorizationDate: "2024-05-28",
          effectiveDate: "2024-06-01",
          expirationDate: "2024-08-01",
          authorizedServices: ["G0154", "G0151", "G0152", "G0155"],
          authorizedUnits: {
            G0154: 20,
            G0151: 16,
            G0152: 12,
            G0155: 8,
          },
          usedUnits: {
            G0154: 18,
            G0151: 14,
            G0152: 10,
            G0155: 6,
          },
          remainingUnits: {
            G0154: 2,
            G0151: 2,
            G0152: 2,
            G0155: 2,
          },
          authorizingPhysician: "Dr. Sarah Thompson",
          status: "active",
          renewalRequired: false,
          authorizationValue: 15750.0,
          utilizationRate: 87.5,
        },
        complianceData: {
          pocSigned: true,
          pocSignatureDate: "2024-05-30",
          face2FaceCompleted: true,
          face2FaceDate: "2024-05-29",
          initialAssessmentCompleted: true,
          initialAssessmentDate: "2024-06-01",
          requiredDocuments: [
            {
              documentType: "Plan of Care",
              required: true,
              received: true,
              receivedDate: "2024-05-30",
              status: "current",
              impactOnReimbursement: 0,
            },
            {
              documentType: "Face-to-Face Encounter",
              required: true,
              received: true,
              receivedDate: "2024-05-29",
              status: "current",
              impactOnReimbursement: 0,
            },
          ],
          lupaStatus: "safe",
          lupaThresholds: {
            G0154: 10,
            G0151: 10,
            G0152: 10,
            G0155: 7,
          },
          qualityMeasures: [
            {
              measureId: "M1021",
              measureName: "Primary Diagnosis",
              target: 1,
              actual: 1,
              status: "met",
              impactOnReimbursement: 0,
              category: "process",
            },
            {
              measureId: "M1033",
              measureName: "Risk of Hospitalization",
              target: 0,
              actual: 0,
              status: "met",
              impactOnReimbursement: 150.0,
              category: "outcome",
            },
          ],
          complianceScore: 98,
          riskLevel: "low",
          complianceIssues: [],
          auditReadiness: 95,
        },
        billingStatus: "paid",
        lastBillingDate: "2024-07-01",
        outstandingBalance: 0,
        paymentHistory: [
          {
            paymentId: "PAY-001",
            paymentDate: "2024-07-02",
            amount: 14175.0,
            paymentMethod: "EFT",
            referenceNumber: "REF-789456",
            adjustments: [
              {
                adjustmentCode: "CO-45",
                adjustmentReason: "Charge exceeds fee schedule",
                amount: -1575.0,
                adjustmentType: "contractual",
              },
            ],
            payerName: "Medicare",
            eraNumber: "ERA-2024-001234",
            processingTime: 18,
            paymentStatus: "processed",
          },
        ],
        financialAnalytics: {
          revenuePerVisit: 875.0,
          costPerVisit: 125.0,
          profitPerVisit: 750.0,
          marginPerVisit: 85.7,
          reimbursementTrend: [
            { period: "2024-06", value: 14175.0, change: 1250.0, changePercent: 9.7 },
            { period: "2024-05", value: 12925.0, change: -850.0, changePercent: -6.2 },
          ],
          costTrend: [
            { period: "2024-06", value: 2250.0, change: 150.0, changePercent: 7.1 },
            { period: "2024-05", value: 2100.0, change: 75.0, changePercent: 3.7 },
          ],
          profitabilityTrend: [
            { period: "2024-06", value: 11925.0, change: 1100.0, changePercent: 10.2 },
            { period: "2024-05", value: 10825.0, change: -925.0, changePercent: -7.9 },
          ],
          benchmarkComparison: {
            industryAverage: 82.5,
            topQuartile: 88.2,
            bottomQuartile: 75.8,
            percentileRank: 92,
          },
        },
        revenueBreakdown: {
          insuranceRevenue: 14175.0,
          patientRevenue: 0.0,
          otherRevenue: 0.0,
          totalRevenue: 14175.0,
          revenueByService: {
            G0154: 2250.0,
            G0151: 2100.0,
            G0152: 1400.0,
            G0155: 750.0,
          },
          revenueByPayer: {
            Medicare: 14175.0,
          },
          revenueByMonth: {
            "2024-06": 7087.5,
            "2024-07": 7087.5,
          },
        },
        costAnalysis: {
          directCosts: 2250.0,
          indirectCosts: 562.5,
          totalCosts: 2812.5,
          costByService: {
            G0154: 1125.0,
            G0151: 1050.0,
            G0152: 700.0,
            G0155: 375.0,
          },
          costByDiscipline: {
            RN: 1125.0,
            PT: 1050.0,
            OT: 700.0,
            MSW: 375.0,
          },
          costPerEpisode: 2812.5,
          costVariance: -187.5,
        },
        profitabilityMetrics: {
          grossProfit: 11925.0,
          netProfit: 11362.5,
          grossMargin: 84.1,
          netMargin: 80.2,
          ebitda: 11500.0,
          roi: 403.8,
          paybackPeriod: 0.25,
          breakEvenPoint: 3.2,
        },
      },
      {
        patientId: "PT-2024-005",
        axxessId: "AX-12349",
        episodeId: "EP-789124",
        episodeStartDate: "2024-06-15",
        episodeEndDate: "2024-07-08",
        totalCharges: 8950.0,
        visitData: [
          {
            visitId: "V-004",
            visitDate: "2024-06-15",
            serviceCode: "G0154",
            serviceDescription: "Direct skilled nursing services of a registered nurse",
            discipline: "RN",
            nurseId: "RN-002",
            nurseName: "David Rodriguez",
            duration: 45,
            units: 1,
            unitCharge: 125.0,
            totalCharge: 125.0,
            placeOfService: "12",
            diagnosisCode: "J44.1",
            supervisingPhysician: "Dr. Michael Chen",
            authorizationNumber: "AUTH-789124",
            complianceFlags: ["high_frequency"],
            billingStatus: "pending_review",
            reimbursementAmount: 106.25,
          },
        ],
        insuranceInfo: {
          primaryInsurance: {
            payerId: "00510",
            payerName: "Medicare Advantage",
            policyNumber: "MA-887766",
            subscriberId: "987654321B",
            relationshipToSubscriber: "self",
            effectiveDate: "2024-01-01",
            reimbursementRate: 85.0,
            contractType: "managed_care",
          },
          eligibilityVerified: true,
          lastEligibilityCheck: "2024-07-10T08:00:00Z",
          copayAmount: 25,
          deductibleAmount: 500,
          deductibleMet: 350,
          outOfPocketMax: 3000,
          outOfPocketMet: 1250,
          priorAuthRequired: true,
          benefitsPeriod: "2024",
          coverageLimitations: ["Therapy visits limited to 20 per year"],
        },
        authorizationInfo: {
          authorizationNumber: "AUTH-789124",
          authorizationDate: "2024-06-10",
          effectiveDate: "2024-06-15",
          expirationDate: "2024-08-15",
          authorizedServices: ["G0154", "G0155"],
          authorizedUnits: {
            G0154: 25,
            G0155: 15,
          },
          usedUnits: {
            G0154: 22,
            G0155: 12,
          },
          remainingUnits: {
            G0154: 3,
            G0155: 3,
          },
          authorizingPhysician: "Dr. Michael Chen",
          status: "active",
          renewalRequired: true,
          renewalDate: "2024-08-01",
          authorizationValue: 8950.0,
          utilizationRate: 91.9,
        },
        complianceData: {
          pocSigned: true,
          pocSignatureDate: "2024-06-12",
          face2FaceCompleted: true,
          face2FaceDate: "2024-06-11",
          initialAssessmentCompleted: true,
          initialAssessmentDate: "2024-06-15",
          requiredDocuments: [
            {
              documentType: "Plan of Care",
              required: true,
              received: true,
              receivedDate: "2024-06-12",
              status: "current",
              impactOnReimbursement: 0,
            },
            {
              documentType: "Physician Orders",
              required: true,
              received: false,
              status: "missing",
              impactOnReimbursement: -1790.0,
            },
          ],
          lupaStatus: "over_threshold",
          lupaThresholds: {
            G0154: 10,
            G0155: 7,
          },
          qualityMeasures: [
            {
              measureId: "M1021",
              measureName: "Primary Diagnosis",
              target: 1,
              actual: 1,
              status: "met",
              impactOnReimbursement: 0,
              category: "process",
            },
            {
              measureId: "M1311",
              measureName: "Current Number of Unhealed Pressure Ulcers",
              target: 0,
              actual: 1,
              status: "not_met",
              impactOnReimbursement: -447.5,
              category: "outcome",
            },
          ],
          complianceScore: 72,
          riskLevel: "high",
          complianceIssues: [
            {
              issueId: "CI-001",
              issueType: "missing_documentation",
              severity: "critical",
              description: "Missing physician orders",
              financialImpact: -1790.0,
              resolutionRequired: true,
              dueDate: "2024-07-15",
            },
            {
              issueId: "CI-002",
              issueType: "lupa_threshold",
              severity: "high",
              description: "Visit frequency exceeds LUPA threshold",
              financialImpact: -895.0,
              resolutionRequired: true,
            },
          ],
          auditReadiness: 65,
        },
        billingStatus: "compliance_review_needed",
        outstandingBalance: 8950.0,
        paymentHistory: [],
        financialAnalytics: {
          revenuePerVisit: 639.29,
          costPerVisit: 135.0,
          profitPerVisit: 504.29,
          marginPerVisit: 78.9,
          reimbursementTrend: [
            { period: "2024-06", value: 7607.5, change: -895.0, changePercent: -10.5 },
            { period: "2024-05", value: 8502.5, change: 450.0, changePercent: 5.6 },
          ],
          costTrend: [
            { period: "2024-06", value: 1890.0, change: 135.0, changePercent: 7.7 },
            { period: "2024-05", value: 1755.0, change: 90.0, changePercent: 5.4 },
          ],
          profitabilityTrend: [
            { period: "2024-06", value: 5717.5, change: -1030.0, changePercent: -15.3 },
            { period: "2024-05", value: 6747.5, change: 360.0, changePercent: 5.6 },
          ],
          benchmarkComparison: {
            industryAverage: 82.5,
            topQuartile: 88.2,
            bottomQuartile: 75.8,
            percentileRank: 78,
          },
        },
        revenueBreakdown: {
          insuranceRevenue: 7607.5,
          patientRevenue: 350.0,
          otherRevenue: 0.0,
          totalRevenue: 7957.5,
          revenueByService: {
            G0154: 2750.0,
            G0155: 1500.0,
          },
          revenueByPayer: {
            "Medicare Advantage": 7607.5,
            Patient: 350.0,
          },
          revenueByMonth: {
            "2024-06": 3978.75,
            "2024-07": 3978.75,
          },
        },
        costAnalysis: {
          directCosts: 1890.0,
          indirectCosts: 472.5,
          totalCosts: 2362.5,
          costByService: {
            G0154: 1485.0,
            G0155: 405.0,
          },
          costByDiscipline: {
            RN: 1485.0,
            MSW: 405.0,
          },
          costPerEpisode: 2362.5,
          costVariance: 127.5,
        },
        profitabilityMetrics: {
          grossProfit: 5595.0,
          netProfit: 5122.5,
          grossMargin: 70.3,
          netMargin: 64.4,
          ebitda: 5300.0,
          roi: 216.8,
          paybackPeriod: 0.46,
          breakEvenPoint: 3.7,
        },
      },
    ]

    // Convert Axxess billing data to our billing record format with enhanced financial data
    const billingRecords = mockBillingData.map((axxessData) => {
      const complianceScore = axxessData.complianceData.complianceScore
      const complianceIssues = generateComplianceIssues(axxessData.complianceData)

      return {
        id: `BILL-AX-${axxessData.axxessId}`,
        patientId: axxessData.patientId,
        patientName: getPatientName(axxessData.patientId),
        axxessId: axxessData.axxessId,
        episodeStartDate: axxessData.episodeStartDate,
        episodeEndDate: axxessData.episodeEndDate,
        status: mapBillingStatus(axxessData.billingStatus, complianceScore),
        totalCharges: axxessData.totalCharges,
        expectedReimbursement: axxessData.revenueBreakdown.totalRevenue,
        actualReimbursement: calculateActualReimbursement(axxessData.paymentHistory),
        insuranceType: axxessData.insuranceInfo.primaryInsurance.payerName,
        ub04Generated: axxessData.billingStatus === "paid" || axxessData.billingStatus === "pending_review",
        complianceScore,
        lastUpdated: new Date().toISOString(),
        visitCount: axxessData.visitData.length,
        serviceLines: axxessData.visitData.map((visit) => ({
          id: visit.visitId,
          serviceDate: visit.visitDate,
          serviceCode: visit.serviceCode,
          description: visit.serviceDescription,
          units: visit.units,
          unitCharge: visit.unitCharge,
          totalCharge: visit.totalCharge,
          modifier: visit.modifier,
          discipline: visit.discipline,
          nurseId: visit.nurseId,
          nurseName: visit.nurseName,
        })),
        complianceIssues,
        // Enhanced financial data from Axxess
        financialAnalytics: axxessData.financialAnalytics,
        revenueBreakdown: axxessData.revenueBreakdown,
        costAnalysis: axxessData.costAnalysis,
        profitabilityMetrics: axxessData.profitabilityMetrics,
        paymentHistory: axxessData.paymentHistory,
        authorizationInfo: axxessData.authorizationInfo,
        insuranceInfo: axxessData.insuranceInfo,
        axxessData: axxessData, // Store full Axxess data for reference
      }
    })

    // Calculate comprehensive financial summary
    const financialSummary = {
      totalCharges: mockBillingData.reduce((sum, data) => sum + data.totalCharges, 0),
      totalRevenue: mockBillingData.reduce((sum, data) => sum + data.revenueBreakdown.totalRevenue, 0),
      totalCosts: mockBillingData.reduce((sum, data) => sum + data.costAnalysis.totalCosts, 0),
      totalProfit: mockBillingData.reduce((sum, data) => sum + data.profitabilityMetrics.grossProfit, 0),
      averageMargin:
        mockBillingData.reduce((sum, data) => sum + data.profitabilityMetrics.grossMargin, 0) / mockBillingData.length,
      averageReimbursementRate:
        mockBillingData.reduce((sum, data) => sum + data.insuranceInfo.primaryInsurance.reimbursementRate, 0) /
        mockBillingData.length,
      outstandingBalance: mockBillingData.reduce((sum, data) => sum + data.outstandingBalance, 0),
      collectionRate: calculateCollectionRate(mockBillingData),
      denialRate: calculateDenialRate(mockBillingData),
      averagePaymentTime: calculateAveragePaymentTime(mockBillingData),
      revenueByPayer: calculateRevenueByPayer(mockBillingData),
      costByService: calculateCostByService(mockBillingData),
      profitabilityTrend: calculateProfitabilityTrend(mockBillingData),
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${billingRecords.length} billing records from Axxess with comprehensive financial data`,
      billingRecords,
      syncTimestamp: new Date().toISOString(),
      recordsProcessed: billingRecords.length,
      financialSummary,
      metadata: {
        includeVisitData,
        includeBillingData,
        includePaymentHistory,
        includeFinancialAnalytics,
        dateRange,
      },
    })
  } catch (error) {
    console.error("Axxess billing sync error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to sync billing data from Axxess",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper functions
function generateComplianceIssues(complianceData: ComplianceData): any[] {
  return complianceData.complianceIssues.map((issue) => ({
    id: issue.issueId,
    type: issue.issueType,
    severity: issue.severity,
    description: issue.description,
    financialImpact: issue.financialImpact,
    resolutionRequired: issue.resolutionRequired,
    dueDate: issue.dueDate,
  }))
}

function mapBillingStatus(axxessStatus: string, complianceScore: number): string {
  if (complianceScore < 70) return "compliance_check"
  if (axxessStatus === "paid") return "paid"
  if (axxessStatus === "pending_review" && complianceScore >= 90) return "ready_to_submit"
  if (axxessStatus === "compliance_review_needed") return "compliance_check"
  return "draft"
}

function calculateActualReimbursement(paymentHistory: PaymentRecord[]): number | undefined {
  if (paymentHistory.length === 0) return undefined
  return paymentHistory.reduce((total, payment) => total + payment.amount, 0)
}

function getPatientName(patientId: string): string {
  const mockNames: Record<string, string> = {
    "PT-2024-004": "Helen Rodriguez",
    "PT-2024-005": "William Chen",
  }
  return mockNames[patientId] || "Unknown Patient"
}

function calculateCollectionRate(billingData: AxxessBillingData[]): number {
  const totalBilled = billingData.reduce((sum, data) => sum + data.totalCharges, 0)
  const totalCollected = billingData.reduce(
    (sum, data) => sum + data.paymentHistory.reduce((paySum, payment) => paySum + payment.amount, 0),
    0,
  )
  return totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0
}

function calculateDenialRate(billingData: AxxessBillingData[]): number {
  const totalClaims = billingData.length
  const deniedClaims = billingData.filter((data) =>
    data.visitData.some((visit) => visit.billingStatus === "denied"),
  ).length
  return totalClaims > 0 ? (deniedClaims / totalClaims) * 100 : 0
}

function calculateAveragePaymentTime(billingData: AxxessBillingData[]): number {
  const paymentsWithTime = billingData.flatMap((data) =>
    data.paymentHistory.filter((payment) => payment.processingTime > 0),
  )
  return paymentsWithTime.length > 0
    ? paymentsWithTime.reduce((sum, payment) => sum + payment.processingTime, 0) / paymentsWithTime.length
    : 0
}

function calculateRevenueByPayer(billingData: AxxessBillingData[]): Record<string, number> {
  const revenueByPayer: Record<string, number> = {}
  billingData.forEach((data) => {
    Object.entries(data.revenueBreakdown.revenueByPayer).forEach(([payer, revenue]) => {
      revenueByPayer[payer] = (revenueByPayer[payer] || 0) + revenue
    })
  })
  return revenueByPayer
}

function calculateCostByService(billingData: AxxessBillingData[]): Record<string, number> {
  const costByService: Record<string, number> = {}
  billingData.forEach((data) => {
    Object.entries(data.costAnalysis.costByService).forEach(([service, cost]) => {
      costByService[service] = (costByService[service] || 0) + cost
    })
  })
  return costByService
}

function calculateProfitabilityTrend(billingData: AxxessBillingData[]): TrendData[] {
  // Aggregate profitability trends across all episodes
  const trendMap: Record<string, { value: number; count: number }> = {}

  billingData.forEach((data) => {
    data.financialAnalytics.profitabilityTrend.forEach((trend) => {
      if (!trendMap[trend.period]) {
        trendMap[trend.period] = { value: 0, count: 0 }
      }
      trendMap[trend.period].value += trend.value
      trendMap[trend.period].count += 1
    })
  })

  return Object.entries(trendMap).map(([period, data]) => ({
    period,
    value: data.value / data.count,
    change: 0, // Would calculate based on previous period
    changePercent: 0,
  }))
}
