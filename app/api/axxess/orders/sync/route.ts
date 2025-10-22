import { type NextRequest, NextResponse } from "next/server"

interface AxxessOrder {
  orderId: string
  patientId: string
  patientName: string
  orderType: string
  physicianName: string
  dateReceived: string
  priority: "routine" | "urgent" | "stat"
  services: string[]
  insuranceType: string
  estimatedValue: number
  status: string
  billingData?: {
    totalCharges: number
    projectedReimbursement: number
    actualReimbursement?: number
    claimStatus: string
    claimNumber?: string
    submissionDate?: string
    paymentDate?: string
    denialReason?: string
    authorizationNumber?: string
    authorizationExpiry?: string
    eligibilityStatus: string
    deductibleMet: number
    deductibleTotal: number
    copayAmount: number
    patientResponsibility: number
  }
  financialData?: {
    episodeValue: number
    reimbursementRate: number
    atRiskAmount: number
    profitMargin: number
    costPerVisit: number
    totalVisits: number
    averageVisitCost: number
    insurancePayments: PaymentRecord[]
    patientPayments: PaymentRecord[]
    adjustments: AdjustmentRecord[]
    writeOffs: WriteOffRecord[]
  }
  complianceData?: {
    pocSigned: boolean
    pocSignatureDate?: string
    face2FaceCompleted: boolean
    face2FaceDate?: string
    initialAssessmentCompleted: boolean
    complianceScore: number
    lupaStatus: "safe" | "at_risk" | "over_threshold"
    qualityMeasures: QualityMeasure[]
    requiredDocuments: DocumentStatus[]
  }
}

interface PaymentRecord {
  paymentId: string
  paymentDate: string
  amount: number
  paymentMethod: string
  referenceNumber: string
  payerName: string
  checkNumber?: string
  eraNumber?: string
}

interface AdjustmentRecord {
  adjustmentId: string
  adjustmentDate: string
  amount: number
  adjustmentCode: string
  adjustmentReason: string
  adjustmentType: "contractual" | "administrative" | "other"
}

interface WriteOffRecord {
  writeOffId: string
  writeOffDate: string
  amount: number
  reason: string
  category: "bad_debt" | "charity_care" | "contractual" | "other"
}

interface QualityMeasure {
  measureId: string
  measureName: string
  target: number
  actual: number
  status: "met" | "not_met" | "pending"
  impactOnReimbursement: number
}

interface DocumentStatus {
  documentType: string
  required: boolean
  received: boolean
  receivedDate?: string
  expirationDate?: string
  status: "current" | "expired" | "missing"
}

export async function POST(request: NextRequest) {
  try {
    const {
      includeBillingData = true,
      includeFinancialData = true,
      includeComplianceData = true,
    } = await request.json()

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock comprehensive Axxess API response with billing and financial data
    const mockAxxessOrders: AxxessOrder[] = [
      {
        orderId: "AX-789127",
        patientId: "PT-12349",
        patientName: "Jennifer Wilson",
        orderType: "Initial Assessment",
        physicianName: "Dr. Sarah Thompson",
        dateReceived: new Date().toISOString().split("T")[0],
        priority: "urgent",
        services: ["Skilled Nursing", "Physical Therapy", "Occupational Therapy"],
        insuranceType: "Medicare",
        estimatedValue: 15750,
        status: "active",
        billingData: {
          totalCharges: 15750.0,
          projectedReimbursement: 14175.0,
          actualReimbursement: 13890.5,
          claimStatus: "paid",
          claimNumber: "CLM-2024-001234",
          submissionDate: "2024-06-15T10:00:00Z",
          paymentDate: "2024-07-02T14:30:00Z",
          authorizationNumber: "AUTH-789123",
          authorizationExpiry: "2024-08-15",
          eligibilityStatus: "eligible",
          deductibleMet: 1632.0,
          deductibleTotal: 1632.0,
          copayAmount: 0.0,
          patientResponsibility: 284.5,
        },
        financialData: {
          episodeValue: 15750.0,
          reimbursementRate: 88.2,
          atRiskAmount: 1575.0,
          profitMargin: 22.5,
          costPerVisit: 125.0,
          totalVisits: 18,
          averageVisitCost: 875.0,
          insurancePayments: [
            {
              paymentId: "PAY-001",
              paymentDate: "2024-07-02",
              amount: 13890.5,
              paymentMethod: "EFT",
              referenceNumber: "REF-789456",
              payerName: "Medicare",
              eraNumber: "ERA-2024-001234",
            },
          ],
          patientPayments: [
            {
              paymentId: "PAY-002",
              paymentDate: "2024-07-05",
              amount: 284.5,
              paymentMethod: "Check",
              referenceNumber: "CHK-001234",
              payerName: "Jennifer Wilson",
              checkNumber: "1234",
            },
          ],
          adjustments: [
            {
              adjustmentId: "ADJ-001",
              adjustmentDate: "2024-07-02",
              amount: -284.5,
              adjustmentCode: "CO-45",
              adjustmentReason: "Charge exceeds fee schedule",
              adjustmentType: "contractual",
            },
          ],
          writeOffs: [],
        },
        complianceData: {
          pocSigned: true,
          pocSignatureDate: "2024-05-30",
          face2FaceCompleted: true,
          face2FaceDate: "2024-05-29",
          initialAssessmentCompleted: true,
          complianceScore: 98,
          lupaStatus: "safe",
          qualityMeasures: [
            {
              measureId: "M1021",
              measureName: "Primary Diagnosis",
              target: 1,
              actual: 1,
              status: "met",
              impactOnReimbursement: 0,
            },
            {
              measureId: "M1033",
              measureName: "Risk of Hospitalization",
              target: 0,
              actual: 0,
              status: "met",
              impactOnReimbursement: 150.0,
            },
          ],
          requiredDocuments: [
            {
              documentType: "Plan of Care",
              required: true,
              received: true,
              receivedDate: "2024-05-30",
              status: "current",
            },
            {
              documentType: "Face-to-Face Encounter",
              required: true,
              received: true,
              receivedDate: "2024-05-29",
              status: "current",
            },
          ],
        },
      },
      {
        orderId: "AX-789128",
        patientId: "PT-12350",
        patientName: "Michael Davis",
        orderType: "Recertification",
        physicianName: "Dr. Robert Johnson",
        dateReceived: new Date().toISOString().split("T")[0],
        priority: "routine",
        services: ["Home Health Aide", "Medical Social Services"],
        insuranceType: "Medicaid",
        estimatedValue: 8950,
        status: "pending_billing",
        billingData: {
          totalCharges: 8950.0,
          projectedReimbursement: 7612.5,
          claimStatus: "pending",
          authorizationNumber: "AUTH-789124",
          authorizationExpiry: "2024-09-30",
          eligibilityStatus: "eligible",
          deductibleMet: 0.0,
          deductibleTotal: 500.0,
          copayAmount: 25.0,
          patientResponsibility: 1362.5,
        },
        financialData: {
          episodeValue: 8950.0,
          reimbursementRate: 85.1,
          atRiskAmount: 1342.5,
          profitMargin: 18.2,
          costPerVisit: 95.0,
          totalVisits: 14,
          averageVisitCost: 639.29,
          insurancePayments: [],
          patientPayments: [],
          adjustments: [],
          writeOffs: [],
        },
        complianceData: {
          pocSigned: true,
          pocSignatureDate: "2024-06-12",
          face2FaceCompleted: true,
          face2FaceDate: "2024-06-11",
          initialAssessmentCompleted: true,
          complianceScore: 92,
          lupaStatus: "safe",
          qualityMeasures: [
            {
              measureId: "M1021",
              measureName: "Primary Diagnosis",
              target: 1,
              actual: 1,
              status: "met",
              impactOnReimbursement: 0,
            },
          ],
          requiredDocuments: [
            {
              documentType: "Plan of Care",
              required: true,
              received: true,
              receivedDate: "2024-06-12",
              status: "current",
            },
            {
              documentType: "Physician Orders",
              required: true,
              received: false,
              status: "missing",
            },
          ],
        },
      },
      {
        orderId: "AX-789129",
        patientId: "PT-12351",
        patientName: "Dorothy Williams",
        orderType: "Resumption of Care",
        physicianName: "Dr. Lisa Chen",
        dateReceived: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "urgent",
        services: ["Skilled Nursing", "Physical Therapy", "Speech Therapy"],
        insuranceType: "Blue Cross Blue Shield",
        estimatedValue: 12500,
        status: "denied",
        billingData: {
          totalCharges: 12500.0,
          projectedReimbursement: 10625.0,
          actualReimbursement: 0.0,
          claimStatus: "denied",
          claimNumber: "CLM-2024-001235",
          submissionDate: "2024-06-20T10:00:00Z",
          denialReason: "Medical necessity not established",
          authorizationNumber: "AUTH-789125",
          authorizationExpiry: "2024-07-20",
          eligibilityStatus: "eligible",
          deductibleMet: 2500.0,
          deductibleTotal: 3000.0,
          copayAmount: 50.0,
          patientResponsibility: 12500.0,
        },
        financialData: {
          episodeValue: 12500.0,
          reimbursementRate: 0.0,
          atRiskAmount: 12500.0,
          profitMargin: -100.0,
          costPerVisit: 150.0,
          totalVisits: 16,
          averageVisitCost: 781.25,
          insurancePayments: [],
          patientPayments: [],
          adjustments: [],
          writeOffs: [
            {
              writeOffId: "WO-001",
              writeOffDate: "2024-07-15",
              amount: 12500.0,
              reason: "Denied claim - medical necessity",
              category: "bad_debt",
            },
          ],
        },
        complianceData: {
          pocSigned: false,
          face2FaceCompleted: false,
          initialAssessmentCompleted: true,
          complianceScore: 45,
          lupaStatus: "over_threshold",
          qualityMeasures: [
            {
              measureId: "M1021",
              measureName: "Primary Diagnosis",
              target: 1,
              actual: 0,
              status: "not_met",
              impactOnReimbursement: -2500.0,
            },
          ],
          requiredDocuments: [
            {
              documentType: "Plan of Care",
              required: true,
              received: false,
              status: "missing",
            },
            {
              documentType: "Face-to-Face Encounter",
              required: true,
              received: false,
              status: "missing",
            },
          ],
        },
      },
      {
        orderId: "AX-789130",
        patientId: "PT-12352",
        patientName: "Robert Thompson",
        orderType: "Initial Assessment",
        physicianName: "Dr. Maria Rodriguez",
        dateReceived: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "routine",
        services: ["Skilled Nursing", "Home Health Aide"],
        insuranceType: "Humana",
        estimatedValue: 6750,
        status: "in_progress",
        billingData: {
          totalCharges: 6750.0,
          projectedReimbursement: 5737.5,
          claimStatus: "in_progress",
          authorizationNumber: "AUTH-789126",
          authorizationExpiry: "2024-10-15",
          eligibilityStatus: "eligible",
          deductibleMet: 1200.0,
          deductibleTotal: 2000.0,
          copayAmount: 35.0,
          patientResponsibility: 1047.5,
        },
        financialData: {
          episodeValue: 6750.0,
          reimbursementRate: 85.0,
          atRiskAmount: 1012.5,
          profitMargin: 25.3,
          costPerVisit: 110.0,
          totalVisits: 12,
          averageVisitCost: 562.5,
          insurancePayments: [],
          patientPayments: [],
          adjustments: [],
          writeOffs: [],
        },
        complianceData: {
          pocSigned: true,
          pocSignatureDate: "2024-07-08",
          face2FaceCompleted: true,
          face2FaceDate: "2024-07-07",
          initialAssessmentCompleted: true,
          complianceScore: 95,
          lupaStatus: "safe",
          qualityMeasures: [
            {
              measureId: "M1021",
              measureName: "Primary Diagnosis",
              target: 1,
              actual: 1,
              status: "met",
              impactOnReimbursement: 0,
            },
            {
              measureId: "M1311",
              measureName: "Current Number of Unhealed Pressure Ulcers",
              target: 0,
              actual: 0,
              status: "met",
              impactOnReimbursement: 100.0,
            },
          ],
          requiredDocuments: [
            {
              documentType: "Plan of Care",
              required: true,
              received: true,
              receivedDate: "2024-07-08",
              status: "current",
            },
            {
              documentType: "Face-to-Face Encounter",
              required: true,
              received: true,
              receivedDate: "2024-07-07",
              status: "current",
            },
            {
              documentType: "Physician Orders",
              required: true,
              received: true,
              receivedDate: "2024-07-06",
              status: "current",
            },
          ],
        },
      },
    ]

    // Calculate summary financial metrics
    const totalCharges = mockAxxessOrders.reduce((sum, order) => sum + (order.billingData?.totalCharges || 0), 0)
    const totalProjectedReimbursement = mockAxxessOrders.reduce(
      (sum, order) => sum + (order.billingData?.projectedReimbursement || 0),
      0,
    )
    const totalActualReimbursement = mockAxxessOrders.reduce(
      (sum, order) => sum + (order.billingData?.actualReimbursement || 0),
      0,
    )
    const totalAtRisk = mockAxxessOrders.reduce((sum, order) => sum + (order.financialData?.atRiskAmount || 0), 0)
    const averageReimbursementRate =
      mockAxxessOrders.reduce((sum, order) => sum + (order.financialData?.reimbursementRate || 0), 0) /
      mockAxxessOrders.length

    // Calculate compliance metrics
    const averageComplianceScore =
      mockAxxessOrders.reduce((sum, order) => sum + (order.complianceData?.complianceScore || 0), 0) /
      mockAxxessOrders.length
    const criticalComplianceIssues = mockAxxessOrders.filter(
      (order) => (order.complianceData?.complianceScore || 0) < 70,
    ).length
    const lupaRiskOrders = mockAxxessOrders.filter((order) => order.complianceData?.lupaStatus !== "safe").length

    // In real implementation, save to database here
    // await saveOrdersToDatabase(mockAxxessOrders)

    return NextResponse.json({
      success: true,
      message: "Orders synced successfully from Axxess with complete billing and financial data",
      ordersCount: mockAxxessOrders.length,
      orders: mockAxxessOrders,
      syncTimestamp: new Date().toISOString(),
      financialSummary: {
        totalCharges,
        totalProjectedReimbursement,
        totalActualReimbursement,
        totalAtRisk,
        averageReimbursementRate: Math.round(averageReimbursementRate * 100) / 100,
        reimbursementGap: totalProjectedReimbursement - totalActualReimbursement,
        collectionRate:
          totalActualReimbursement > 0 ? (totalActualReimbursement / totalProjectedReimbursement) * 100 : 0,
      },
      complianceSummary: {
        averageComplianceScore: Math.round(averageComplianceScore * 100) / 100,
        criticalComplianceIssues,
        lupaRiskOrders,
        totalQualityMeasures: mockAxxessOrders.reduce(
          (sum, order) => sum + (order.complianceData?.qualityMeasures.length || 0),
          0,
        ),
        metQualityMeasures: mockAxxessOrders.reduce(
          (sum, order) => sum + (order.complianceData?.qualityMeasures.filter((m) => m.status === "met").length || 0),
          0,
        ),
      },
      dataIncluded: {
        billingData: includeBillingData,
        financialData: includeFinancialData,
        complianceData: includeComplianceData,
      },
    })
  } catch (error) {
    console.error("Axxess sync error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to sync orders from Axxess",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get sync status and last sync time with financial metrics
    const lastSyncTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    return NextResponse.json({
      success: true,
      lastSyncTime: lastSyncTime.toISOString(),
      nextScheduledSync: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      syncStatus: "active",
      totalOrdersSynced: 156,
      pendingOrders: 12,
      billingMetrics: {
        totalOutstandingClaims: 23,
        totalOutstandingAmount: 145750.0,
        averageClaimProcessingTime: 18.5, // days
        denialRate: 8.2, // percentage
        collectionRate: 92.3, // percentage
      },
      financialMetrics: {
        monthlyRevenue: 485750.0,
        projectedRevenue: 523200.0,
        atRiskRevenue: 87450.0,
        profitMargin: 21.8,
        costPerEpisode: 2150.0,
      },
      complianceMetrics: {
        averageComplianceScore: 89.5,
        criticalIssues: 3,
        lupaRiskEpisodes: 7,
        qualityMeasureCompliance: 94.2,
      },
    })
  } catch (error) {
    console.error("Failed to get sync status:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get sync status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
