import { type NextRequest, NextResponse } from "next/server"

interface UB04GenerationRequest {
  billingRecordId: string
  patientId?: string
  episodeId?: string
  options?: UB04Options
}

interface UB04Options {
  validateBeforeGeneration: boolean
  includeAttachments: boolean
  electronicFormat: boolean
  printFormat: boolean
  autoSubmit: boolean
  submissionDelay?: number // minutes
}

interface UB04FormData {
  // Patient Information (FL 1-41)
  patientName: string
  patientAddress: string
  patientCity: string
  patientState: string
  patientZip: string
  patientDOB: string
  patientSex: string
  patientSSN?: string

  // Provider Information
  providerName: string
  providerAddress: string
  providerCity: string
  providerState: string
  providerZip: string
  providerNPI: string
  providerTaxId: string

  // Episode Information
  admissionDate: string
  dischargeDate?: string
  statementFromDate: string
  statementToDate: string

  // Insurance Information
  primaryInsurance: InsuranceInfo
  secondaryInsurance?: InsuranceInfo

  // Service Lines
  serviceLines: UB04ServiceLine[]

  // Financial Information
  totalCharges: number
  nonCoveredCharges: number
  estimatedAmountDue: number

  // Codes and Identifiers
  admissionTypeCode: string
  admissionSourceCode: string
  patientStatusCode: string
  principalDiagnosisCode: string
  additionalDiagnosisCodes: string[]
  procedureCodes: ProcedureCode[]

  // Revenue Codes and Charges
  revenueLines: RevenueLine[]

  // Occurrence Codes and Dates
  occurrenceCodes: OccurrenceCode[]

  // Value Codes and Amounts
  valueCodes: ValueCode[]

  // Condition Codes
  conditionCodes: string[]
}

interface InsuranceInfo {
  payerName: string
  payerId: string
  policyNumber: string
  groupNumber?: string
  subscriberName: string
  subscriberId: string
  relationshipCode: string
  authorizationNumber?: string
}

interface UB04ServiceLine {
  serviceDate: string
  revenueCode: string
  description: string
  hcpcsCode?: string
  modifier?: string
  units: number
  totalCharges: number
  nonCoveredCharges: number
}

interface ProcedureCode {
  code: string
  date: string
  description: string
}

interface RevenueLine {
  revenueCode: string
  description: string
  totalCharges: number
  nonCoveredCharges: number
  units: number
  unitRate?: number
}

interface OccurrenceCode {
  code: string
  date: string
  description: string
}

interface ValueCode {
  code: string
  amount: number
  description: string
}

interface UB04ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  completeness: number // percentage
}

interface ValidationError {
  field: string
  code: string
  message: string
  severity: "critical" | "high" | "medium"
}

interface ValidationWarning {
  field: string
  code: string
  message: string
  recommendation: string
}

export async function POST(request: NextRequest) {
  try {
    const { billingRecordId, patientId, episodeId, options = {} }: UB04GenerationRequest = await request.json()

    console.log(`Generating UB-04 form for billing record: ${billingRecordId}`)

    // Set default options
    const defaultOptions: UB04Options = {
      validateBeforeGeneration: true,
      includeAttachments: false,
      electronicFormat: true,
      printFormat: false,
      autoSubmit: false,
      ...options,
    }

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

    // Step 2: Transform data to UB-04 format
    const ub04Data = await transformToUB04Format(billingData)

    // Step 3: Validate UB-04 data if requested
    let validationResult: UB04ValidationResult | null = null
    if (defaultOptions.validateBeforeGeneration) {
      validationResult = await validateUB04Data(ub04Data)

      if (!validationResult.valid) {
        const criticalErrors = validationResult.errors.filter((e) => e.severity === "critical")
        if (criticalErrors.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: "UB-04 validation failed with critical errors",
              validation: validationResult,
            },
            { status: 400 },
          )
        }
      }
    }

    // Step 4: Generate UB-04 form
    const ub04Result = await generateUB04Form(ub04Data, defaultOptions)

    // Step 5: Save generated form
    await saveBillingDocument(billingRecordId, ub04Result)

    // Step 6: Auto-submit if requested
    let submissionResult = null
    if (defaultOptions.autoSubmit) {
      if (defaultOptions.submissionDelay && defaultOptions.submissionDelay > 0) {
        // Schedule for later submission
        await scheduleSubmission(billingRecordId, ub04Result.documentId, defaultOptions.submissionDelay)
        submissionResult = { scheduled: true, delayMinutes: defaultOptions.submissionDelay }
      } else {
        // Submit immediately
        submissionResult = await submitToClearingHouse(ub04Result)
      }
    }

    return NextResponse.json({
      success: true,
      message: "UB-04 form generated successfully",
      ub04: {
        documentId: ub04Result.documentId,
        formNumber: ub04Result.formNumber,
        generatedAt: ub04Result.generatedAt,
        totalCharges: ub04Data.totalCharges,
        estimatedReimbursement: calculateEstimatedReimbursement(ub04Data),
        pageCount: ub04Result.pageCount,
        electronicFormat: defaultOptions.electronicFormat,
        printFormat: defaultOptions.printFormat,
      },
      validation: validationResult,
      submission: submissionResult,
      downloadUrl: `/api/billing/download-ub04/${ub04Result.documentId}`,
    })
  } catch (error) {
    console.error("UB-04 generation failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate UB-04 form",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function fetchBillingData(billingRecordId: string, patientId?: string, episodeId?: string): Promise<any> {
  // In a real implementation, this would fetch from database
  // Mock billing data for demonstration
  return {
    id: billingRecordId,
    patientId: patientId || "PT-2024-001",
    episodeId: episodeId || "EP-2024-001",
    patient: {
      name: "Margaret Anderson",
      address: "123 Main Street",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      dateOfBirth: "1945-03-15",
      sex: "F",
      ssn: "123-45-6789",
    },
    provider: {
      name: "Springfield Home Health Services",
      address: "456 Healthcare Blvd",
      city: "Springfield",
      state: "IL",
      zip: "62702",
      npi: "1234567890",
      taxId: "12-3456789",
    },
    episode: {
      admissionDate: "2024-06-15",
      dischargeDate: "2024-07-10",
      statementFromDate: "2024-06-15",
      statementToDate: "2024-07-10",
      principalDiagnosis: "I63.9",
      additionalDiagnoses: ["Z51.89", "M79.3"],
      admissionType: "1", // Emergency
      admissionSource: "7", // Emergency Room
      patientStatus: "01", // Discharged to home
    },
    insurance: {
      primary: {
        payerName: "Medicare",
        payerId: "00431",
        policyNumber: "1EG4-TE5-MK73",
        subscriberName: "Margaret Anderson",
        subscriberId: "123456789A",
        relationshipCode: "18", // Self
        authorizationNumber: "AUTH-789123",
      },
    },
    serviceLines: [
      {
        serviceDate: "2024-06-15",
        revenueCode: "0550",
        description: "Skilled Nursing",
        hcpcsCode: "G0154",
        units: 8,
        totalCharges: 1000.0,
        nonCoveredCharges: 0,
      },
      {
        serviceDate: "2024-06-15",
        revenueCode: "0420",
        description: "Physical Therapy",
        hcpcsCode: "G0151",
        units: 6,
        totalCharges: 900.0,
        nonCoveredCharges: 0,
      },
      {
        serviceDate: "2024-06-15",
        revenueCode: "0430",
        description: "Occupational Therapy",
        hcpcsCode: "G0152",
        units: 4,
        totalCharges: 560.0,
        nonCoveredCharges: 0,
      },
    ],
    totalCharges: 2460.0,
    nonCoveredCharges: 0,
  }
}

async function transformToUB04Format(billingData: any): Promise<UB04FormData> {
  return {
    // Patient Information
    patientName: billingData.patient.name,
    patientAddress: billingData.patient.address,
    patientCity: billingData.patient.city,
    patientState: billingData.patient.state,
    patientZip: billingData.patient.zip,
    patientDOB: billingData.patient.dateOfBirth,
    patientSex: billingData.patient.sex,
    patientSSN: billingData.patient.ssn,

    // Provider Information
    providerName: billingData.provider.name,
    providerAddress: billingData.provider.address,
    providerCity: billingData.provider.city,
    providerState: billingData.provider.state,
    providerZip: billingData.provider.zip,
    providerNPI: billingData.provider.npi,
    providerTaxId: billingData.provider.taxId,

    // Episode Information
    admissionDate: billingData.episode.admissionDate,
    dischargeDate: billingData.episode.dischargeDate,
    statementFromDate: billingData.episode.statementFromDate,
    statementToDate: billingData.episode.statementToDate,

    // Insurance Information
    primaryInsurance: {
      payerName: billingData.insurance.primary.payerName,
      payerId: billingData.insurance.primary.payerId,
      policyNumber: billingData.insurance.primary.policyNumber,
      subscriberName: billingData.insurance.primary.subscriberName,
      subscriberId: billingData.insurance.primary.subscriberId,
      relationshipCode: billingData.insurance.primary.relationshipCode,
      authorizationNumber: billingData.insurance.primary.authorizationNumber,
    },

    // Service Lines
    serviceLines: billingData.serviceLines.map((line: any) => ({
      serviceDate: line.serviceDate,
      revenueCode: line.revenueCode,
      description: line.description,
      hcpcsCode: line.hcpcsCode,
      modifier: line.modifier,
      units: line.units,
      totalCharges: line.totalCharges,
      nonCoveredCharges: line.nonCoveredCharges,
    })),

    // Financial Information
    totalCharges: billingData.totalCharges,
    nonCoveredCharges: billingData.nonCoveredCharges,
    estimatedAmountDue: billingData.totalCharges * 0.9, // Assuming 90% reimbursement

    // Codes and Identifiers
    admissionTypeCode: billingData.episode.admissionType,
    admissionSourceCode: billingData.episode.admissionSource,
    patientStatusCode: billingData.episode.patientStatus,
    principalDiagnosisCode: billingData.episode.principalDiagnosis,
    additionalDiagnosisCodes: billingData.episode.additionalDiagnoses,
    procedureCodes: [],

    // Revenue Lines
    revenueLines: billingData.serviceLines.map((line: any) => ({
      revenueCode: line.revenueCode,
      description: line.description,
      totalCharges: line.totalCharges,
      nonCoveredCharges: line.nonCoveredCharges,
      units: line.units,
      unitRate: line.totalCharges / line.units,
    })),

    // Occurrence Codes
    occurrenceCodes: [
      {
        code: "11", // Onset of symptoms
        date: billingData.episode.admissionDate,
        description: "Onset of symptoms/illness",
      },
    ],

    // Value Codes
    valueCodes: [
      {
        code: "80", // Covered days
        amount: calculateCoveredDays(billingData.episode.admissionDate, billingData.episode.dischargeDate),
        description: "Covered days",
      },
    ],

    // Condition Codes
    conditionCodes: ["07"], // Treatment of non-terminal condition for hospice
  }
}

async function validateUB04Data(ub04Data: UB04FormData): Promise<UB04ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Required field validations
  if (!ub04Data.patientName) {
    errors.push({
      field: "patientName",
      code: "REQUIRED_FIELD",
      message: "Patient name is required",
      severity: "critical",
    })
  }

  if (!ub04Data.providerNPI || ub04Data.providerNPI.length !== 10) {
    errors.push({
      field: "providerNPI",
      code: "INVALID_NPI",
      message: "Provider NPI must be 10 digits",
      severity: "critical",
    })
  }

  if (!ub04Data.principalDiagnosisCode) {
    errors.push({
      field: "principalDiagnosisCode",
      code: "REQUIRED_FIELD",
      message: "Principal diagnosis code is required",
      severity: "critical",
    })
  }

  if (!ub04Data.primaryInsurance.payerId) {
    errors.push({
      field: "primaryInsurance.payerId",
      code: "REQUIRED_FIELD",
      message: "Primary insurance payer ID is required",
      severity: "critical",
    })
  }

  // Business rule validations
  if (ub04Data.totalCharges <= 0) {
    errors.push({
      field: "totalCharges",
      code: "INVALID_AMOUNT",
      message: "Total charges must be greater than zero",
      severity: "high",
    })
  }

  if (ub04Data.serviceLines.length === 0) {
    errors.push({
      field: "serviceLines",
      code: "NO_SERVICE_LINES",
      message: "At least one service line is required",
      severity: "critical",
    })
  }

  // Date validations
  const admissionDate = new Date(ub04Data.admissionDate)
  const dischargeDate = ub04Data.dischargeDate ? new Date(ub04Data.dischargeDate) : null

  if (dischargeDate && dischargeDate < admissionDate) {
    errors.push({
      field: "dischargeDate",
      code: "INVALID_DATE_SEQUENCE",
      message: "Discharge date cannot be before admission date",
      severity: "high",
    })
  }

  // Warnings
  if (ub04Data.totalCharges > 50000) {
    warnings.push({
      field: "totalCharges",
      code: "HIGH_CHARGES",
      message: "Total charges are unusually high",
      recommendation: "Review charges for accuracy",
    })
  }

  if (!ub04Data.primaryInsurance.authorizationNumber) {
    warnings.push({
      field: "primaryInsurance.authorizationNumber",
      code: "MISSING_AUTHORIZATION",
      message: "Authorization number is missing",
      recommendation: "Verify if authorization is required for this payer",
    })
  }

  // Calculate completeness
  const requiredFields = [
    "patientName",
    "patientDOB",
    "providerNPI",
    "principalDiagnosisCode",
    "admissionDate",
    "totalCharges",
    "primaryInsurance.payerId",
  ]

  const completedFields = requiredFields.filter((field) => {
    const value = field.includes(".")
      ? field.split(".").reduce((obj, key) => obj?.[key], ub04Data)
      : ub04Data[field as keyof UB04FormData]
    return value !== null && value !== undefined && value !== ""
  })

  const completeness = (completedFields.length / requiredFields.length) * 100

  return {
    valid: errors.filter((e) => e.severity === "critical").length === 0,
    errors,
    warnings,
    completeness,
  }
}

async function generateUB04Form(ub04Data: UB04FormData, options: UB04Options): Promise<any> {
  // Simulate UB-04 form generation
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const documentId = `UB04_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const formNumber = `UB04-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

  return {
    documentId,
    formNumber,
    generatedAt: new Date().toISOString(),
    pageCount: 1,
    format: options.electronicFormat ? "electronic" : "print",
    fileSize: 245760, // bytes
    checksum: "abc123def456",
  }
}

async function saveBillingDocument(billingRecordId: string, ub04Result: any): Promise<void> {
  console.log(`Saving UB-04 document ${ub04Result.documentId} for billing record ${billingRecordId}`)
  // In real implementation, save to database and file storage
}

async function scheduleSubmission(billingRecordId: string, documentId: string, delayMinutes: number): Promise<void> {
  console.log(`Scheduling submission of ${documentId} in ${delayMinutes} minutes`)
  // In real implementation, add to job queue or scheduler
}

async function submitToClearingHouse(ub04Result: any): Promise<any> {
  console.log(`Submitting UB-04 ${ub04Result.documentId} to clearing house`)
  // In real implementation, submit to actual clearing house
  return {
    submitted: true,
    submissionId: `SUB_${Date.now()}`,
    clearingHouse: "Change Healthcare",
    submittedAt: new Date().toISOString(),
  }
}

function calculateEstimatedReimbursement(ub04Data: UB04FormData): number {
  // Simple reimbursement calculation - in real implementation, use payer-specific rates
  const baseRate = ub04Data.primaryInsurance.payerName.toLowerCase().includes("medicare") ? 0.85 : 0.8
  return ub04Data.totalCharges * baseRate
}

function calculateCoveredDays(admissionDate: string, dischargeDate?: string): number {
  const start = new Date(admissionDate)
  const end = dischargeDate ? new Date(dischargeDate) : new Date()
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
