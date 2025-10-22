import { type NextRequest, NextResponse } from "next/server"

interface DataCategoryRequest {
  requestId?: string
  patientId: string
  axxessId?: string
  categories: string[]
  dateRange?: {
    start: string
    end: string
  }
  priority: "routine" | "urgent" | "stat"
  requestedBy: string
  purpose: string
  deliveryMethod: "api" | "secure_email" | "portal" | "fax"
  contactInfo?: {
    email?: string
    phone?: string
    faxNumber?: string
  }
}

interface DataCategory {
  categoryId: string
  categoryName: string
  description: string
  dataElements: string[]
  estimatedSize: string
  processingTime: string
  restrictions?: string[]
}

interface ProcessedDataRequest {
  requestId: string
  patientId: string
  axxessId: string
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  requestedCategories: string[]
  processedCategories: DataCategory[]
  requestDate: string
  completionDate?: string
  requestedBy: string
  deliveryMethod: string
  downloadUrl?: string
  expirationDate?: string
  totalRecords: number
  fileSizeMB: number
}

interface G8DataCategoryResponse {
  success: boolean
  request: ProcessedDataRequest
  availableCategories?: DataCategory[]
  timestamp: string
  message?: string
  errors?: string[]
}

export async function POST(request: NextRequest): Promise<NextResponse<G8DataCategoryResponse>> {
  try {
    const requestData: DataCategoryRequest = await request.json()
    
    console.log("G8 Data Category Request:", requestData)
    
    // Simulate API call to Axxess G8 Data Category Request endpoint
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    const requestId = `G8-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Available data categories
    const availableCategories: DataCategory[] = [
      {
        categoryId: "CLINICAL_NOTES",
        categoryName: "Clinical Notes",
        description: "All clinical visit notes and assessments",
        dataElements: ["Visit notes", "Assessment data", "Clinical observations", "Care plans"],
        estimatedSize: "2.5 MB",
        processingTime: "15 minutes",
        restrictions: ["PHI protected", "Audit logged"]
      },
      {
        categoryId: "BILLING_DATA",
        categoryName: "Billing and Claims",
        description: "Billing records, claims, and payment information",
        dataElements: ["Claims data", "Payment records", "Billing codes", "Insurance information"],
        estimatedSize: "1.8 MB",
        processingTime: "10 minutes",
        restrictions: ["Financial data", "Audit logged"]
      },
      {
        categoryId: "MEDICATION_RECORDS",
        categoryName: "Medication Management",
        description: "Medication orders, administration records, and pharmacy data",
        dataElements: ["Medication orders", "Administration records", "Drug interactions", "Pharmacy communications"],
        estimatedSize: "0.9 MB",
        processingTime: "8 minutes",
        restrictions: ["DEA regulated", "PHI protected"]
      },
      {
        categoryId: "LAB_RESULTS",
        categoryName: "Laboratory Results",
        description: "All laboratory test results and reports",
        dataElements: ["Lab orders", "Test results", "Reference ranges", "Physician reviews"],
        estimatedSize: "1.2 MB",
        processingTime: "12 minutes",
        restrictions: ["PHI protected", "Clinical data"]
      },
      {
        categoryId: "OASIS_ASSESSMENTS",
        categoryName: "OASIS Assessments",
        description: "Complete OASIS assessment data and scoring",
        dataElements: ["OASIS forms", "Assessment scores", "Care planning", "Outcome measures"],
        estimatedSize: "3.1 MB",
        processingTime: "20 minutes",
        restrictions: ["Medicare reporting", "Quality measures"]
      }
    ]
    
    // Process requested categories
    const processedCategories = availableCategories.filter(cat => 
      requestData.categories.includes(cat.categoryId)
    )
    
    const totalRecords = processedCategories.reduce((sum, cat) => sum + Math.floor(Math.random() * 100) + 50, 0)
    const fileSizeMB = parseFloat(processedCategories.reduce((sum, cat) => 
      sum + parseFloat(cat.estimatedSize.replace(' MB', '')), 0).toFixed(2))
    
    const processedRequest: ProcessedDataRequest = {
      requestId,
      patientId: requestData.patientId,
      axxessId: requestData.axxessId || `AX-${requestData.patientId}`,
      status: "processing",
      requestedCategories: requestData.categories,
      processedCategories,
      requestDate: new Date().toISOString(),
      requestedBy: requestData.requestedBy,
      deliveryMethod: requestData.deliveryMethod,
      downloadUrl: requestData.deliveryMethod === "api" ? 
        `/api/axxess/g8-data-category-request/download/${requestId}` : undefined,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      totalRecords,
      fileSizeMB
    }
    
    // Simulate processing time based on priority
    if (requestData.priority === "stat") {
      processedRequest.status = "completed"
      processedRequest.completionDate = new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      request: processedRequest,
      timestamp: new Date().toISOString(),
      message: `Data category request ${requestId} has been ${processedRequest.status === "completed" ? "completed" : "queued for processing"}`
    })
    
  } catch (error) {
    console.error("G8 Data Category Request error:", error)
    return NextResponse.json(
      {
        success: false,
        request: {} as ProcessedDataRequest,
        timestamp: new Date().toISOString(),
        message: "Failed to process data category request",
        errors: [error instanceof Error ? error.message : "Unknown error occurred"]
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("requestId")
    const action = searchParams.get("action")
    
    if (action === "categories") {
      // Return available data categories
      const categories: DataCategory[] = [
        {
          categoryId: "CLINICAL_NOTES",
          categoryName: "Clinical Notes",
          description: "All clinical visit notes and assessments",
          dataElements: ["Visit notes", "Assessment data", "Clinical observations", "Care plans"],
          estimatedSize: "2.5 MB",
          processingTime: "15 minutes",
          restrictions: ["PHI protected", "Audit logged"]
        },
        {
          categoryId: "BILLING_DATA",
          categoryName: "Billing and Claims",
          description: "Billing records, claims, and payment information",
          dataElements: ["Claims data", "Payment records", "Billing codes", "Insurance information"],
          estimatedSize: "1.8 MB",
          processingTime: "10 minutes",
          restrictions: ["Financial data", "Audit logged"]
        },
        {
          categoryId: "MEDICATION_RECORDS",
          categoryName: "Medication Management",
          description: "Medication orders, administration records, and pharmacy data",
          dataElements: ["Medication orders", "Administration records", "Drug interactions", "Pharmacy communications"],
          estimatedSize: "0.9 MB",
          processingTime: "8 minutes",
          restrictions: ["DEA regulated", "PHI protected"]
        },
        {
          categoryId: "LAB_RESULTS",
          categoryName: "Laboratory Results",
          description: "All laboratory test results and reports",
          dataElements: ["Lab orders", "Test results", "Reference ranges", "Physician reviews"],
          estimatedSize: "1.2 MB",
          processingTime: "12 minutes",
          restrictions: ["PHI protected", "Clinical data"]
        },
        {
          categoryId: "OASIS_ASSESSMENTS",
          categoryName: "OASIS Assessments",
          description: "Complete OASIS assessment data and scoring",
          dataElements: ["OASIS forms", "Assessment scores", "Care planning", "Outcome measures"],
          estimatedSize: "3.1 MB",
          processingTime: "20 minutes",
          restrictions: ["Medicare reporting", "Quality measures"]
        }
      ]
      
      return NextResponse.json({
        success: true,
        availableCategories: categories,
        timestamp: new Date().toISOString()
      })
    }
    
    if (requestId) {
      // Return specific request status
      const mockRequest = {
        requestId,
        status: "completed",
        requestDate: "2024-01-20T10:00:00Z",
        completionDate: "2024-01-20T10:15:00Z",
        totalRecords: 245,
        fileSizeMB: 4.2,
        downloadUrl: `/api/axxess/g8-data-category-request/download/${requestId}`,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      return NextResponse.json({
        success: true,
        request: mockRequest,
        timestamp: new Date().toISOString()
      })
    }
    
    // Return recent requests
    return NextResponse.json({
      success: true,
      recentRequests: [
        {
          requestId: "G8-1640000000000-abc123def",
          patientId: "PT-2024-001",
          status: "completed",
          requestDate: "2024-01-20T09:00:00Z",
          requestedBy: "System Admin"
        }
      ],
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("G8 Data Category Request GET error:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to retrieve data category request information",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
