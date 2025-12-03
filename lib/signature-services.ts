// Digital signature service integration with Supabase
import { createServiceClient } from "@/lib/supabase/service"

export interface SignatureRequest {
  id: string
  requestId: string
  documentName: string
  orderId?: string
  recipients: SignatureRecipient[]
  status: "draft" | "sent" | "completed" | "cancelled" | "expired"
  createdAt: string
  sentAt?: string
  completedAt?: string
  expiresAt: string
  templateId?: string
}

export interface SignatureRecipient {
  id?: string
  name: string
  email: string
  role: string
  status: "pending" | "viewed" | "signed" | "declined"
  signedAt?: string
  viewedAt?: string
  orderIndex?: number
  signatureData?: string // Base64 encoded signature image
  signerName?: string    // Name entered when signing
}

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  fields: TemplateField[]
  category: string
}

export interface TemplateField {
  name: string
  type: "text" | "signature" | "date" | "checkbox"
  required: boolean
  placeholder?: string
}

// Signature service with Supabase persistence
export class SignatureService {
  private static instance: SignatureService

  static getInstance(): SignatureService {
    if (!SignatureService.instance) {
      SignatureService.instance = new SignatureService()
    }
    return SignatureService.instance
  }

  async createSignatureRequest(
    documentName: string,
    recipients: Omit<SignatureRecipient, "status">[],
    templateId?: string,
    orderId?: string,
  ): Promise<SignatureRequest> {
    const supabase = createServiceClient()
    const requestId = `SIG-${Date.now()}`
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

    // Insert signature request
    const { data: requestData, error: requestError } = await supabase
      .from("signature_requests")
      .insert({
        request_id: requestId,
        document_name: documentName,
        order_id: orderId || null,
        status: "draft",
        expires_at: expiresAt,
        template_id: templateId || null,
      })
      .select()
      .single()

    if (requestError) {
      console.error("Error creating signature request:", requestError)
      throw new Error(`Failed to create signature request: ${requestError.message}`)
    }

    // Insert recipients
    const recipientsToInsert = recipients.map((r, index) => ({
      signature_request_id: requestData.id,
      name: r.name,
      email: r.email,
      role: r.role,
      status: "pending",
      order_index: index,
    }))

    const { data: recipientData, error: recipientError } = await supabase
      .from("signature_recipients")
      .insert(recipientsToInsert)
      .select()

    if (recipientError) {
      console.error("Error creating recipients:", recipientError)
      // Rollback the request
      await supabase.from("signature_requests").delete().eq("id", requestData.id)
      throw new Error(`Failed to create recipients: ${recipientError.message}`)
    }

    return {
      id: requestData.id,
      requestId: requestData.request_id,
      documentName: requestData.document_name,
      orderId: requestData.order_id,
      status: requestData.status,
      createdAt: requestData.created_at,
      expiresAt: requestData.expires_at,
      templateId: requestData.template_id,
      recipients: recipientData.map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        status: r.status,
        orderIndex: r.order_index,
      })),
    }
  }

  async sendForSignature(requestId: string): Promise<void> {
    const supabase = createServiceClient()

    const { error } = await supabase
      .from("signature_requests")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("request_id", requestId)

    if (error) {
      console.error("Error sending signature request:", error)
      throw new Error(`Failed to send signature request: ${error.message}`)
    }

    // In production, this would send emails to recipients
    console.log(`Sending signature request ${requestId} to recipients`)
  }

  async getSignatureRequest(requestId: string): Promise<SignatureRequest | null> {
    const supabase = createServiceClient()

    const { data: requestData, error: requestError } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("request_id", requestId)
      .single()

    if (requestError || !requestData) {
      return null
    }

    const { data: recipientData } = await supabase
      .from("signature_recipients")
      .select("*")
      .eq("signature_request_id", requestData.id)
      .order("order_index", { ascending: true })

    return {
      id: requestData.id,
      requestId: requestData.request_id,
      documentName: requestData.document_name,
      orderId: requestData.order_id,
      status: requestData.status,
      createdAt: requestData.created_at,
      sentAt: requestData.sent_at,
      completedAt: requestData.completed_at,
      expiresAt: requestData.expires_at,
      templateId: requestData.template_id,
      recipients: (recipientData || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        status: r.status,
        signedAt: r.signed_at,
        viewedAt: r.viewed_at,
        orderIndex: r.order_index,
      })),
    }
  }

  async updateRecipientStatus(
    requestId: string,
    recipientEmail: string,
    status: SignatureRecipient["status"],
    signatureData?: string,
    signerName?: string,
  ): Promise<void> {
    const supabase = createServiceClient()

    // Get the signature request first
    const { data: requestData } = await supabase
      .from("signature_requests")
      .select("id")
      .eq("request_id", requestId)
      .single()

    if (!requestData) {
      throw new Error("Signature request not found")
    }

    // Update the recipient
    const updateData: any = { status }
    if (status === "signed") {
      updateData.signed_at = new Date().toISOString()
      if (signatureData) {
        updateData.signature_data = signatureData
      }
      if (signerName) {
        updateData.signer_name = signerName
      }
    } else if (status === "viewed") {
      updateData.viewed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from("signature_recipients")
      .update(updateData)
      .eq("signature_request_id", requestData.id)
      .eq("email", recipientEmail)

    if (updateError) {
      throw new Error(`Failed to update recipient status: ${updateError.message}`)
    }

    // Check if all recipients have signed
    const { data: allRecipients } = await supabase
      .from("signature_recipients")
      .select("status")
      .eq("signature_request_id", requestData.id)

    const allSigned = allRecipients?.every((r: any) => r.status === "signed")
    if (allSigned) {
      await supabase
        .from("signature_requests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", requestData.id)
    }
  }

  async getAllRequests(): Promise<SignatureRequest[]> {
    const supabase = createServiceClient()

    const { data: requestsData, error } = await supabase
      .from("signature_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !requestsData) {
      console.error("Error fetching signature requests:", error)
      return []
    }

    // Get all recipients in one query
    const requestIds = requestsData.map((r: any) => r.id)
    const { data: allRecipients } = await supabase
      .from("signature_recipients")
      .select("*")
      .in("signature_request_id", requestIds)
      .order("order_index", { ascending: true })

    // Group recipients by request
    const recipientsByRequest = (allRecipients || []).reduce((acc: any, r: any) => {
      if (!acc[r.signature_request_id]) {
        acc[r.signature_request_id] = []
      }
      acc[r.signature_request_id].push({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        status: r.status,
        signedAt: r.signed_at,
        viewedAt: r.viewed_at,
        orderIndex: r.order_index,
        signatureData: r.signature_data,
        signerName: r.signer_name,
      })
      return acc
    }, {})

    return requestsData.map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      documentName: r.document_name,
      orderId: r.order_id,
      status: r.status,
      createdAt: r.created_at,
      sentAt: r.sent_at,
      completedAt: r.completed_at,
      expiresAt: r.expires_at,
      templateId: r.template_id,
      recipients: recipientsByRequest[r.id] || [],
    }))
  }

  async cancelRequest(requestId: string): Promise<void> {
    const supabase = createServiceClient()

    const { error } = await supabase
      .from("signature_requests")
      .update({ status: "cancelled" })
      .eq("request_id", requestId)

    if (error) {
      throw new Error(`Failed to cancel signature request: ${error.message}`)
    }
  }

  async deleteRequest(requestId: string): Promise<void> {
    const supabase = createServiceClient()

    // Delete the request (recipients will be deleted via CASCADE)
    const { error } = await supabase
      .from("signature_requests")
      .delete()
      .eq("request_id", requestId)

    if (error) {
      throw new Error(`Failed to delete signature request: ${error.message}`)
    }
  }

  // Template management
  async getTemplates(): Promise<DocumentTemplate[]> {
    return [
      {
        id: "TEMP-001",
        name: "Employment Agreement",
        description: "Standard employment contract template",
        category: "HR",
        fields: [
          { name: "Employee Name", type: "text", required: true },
          { name: "Position", type: "text", required: true },
          { name: "Start Date", type: "date", required: true },
          { name: "Employee Signature", type: "signature", required: true },
          { name: "HR Signature", type: "signature", required: true },
        ],
      },
      {
        id: "TEMP-002",
        name: "Confidentiality Agreement",
        description: "Non-disclosure agreement template",
        category: "Legal",
        fields: [
          { name: "Employee Name", type: "text", required: true },
          { name: "Department", type: "text", required: true },
          { name: "Effective Date", type: "date", required: true },
          { name: "Employee Signature", type: "signature", required: true },
        ],
      },
      {
        id: "TEMP-003",
        name: "Healthcare Order",
        description: "Physician signature for healthcare orders",
        category: "Healthcare",
        fields: [
          { name: "Patient Name", type: "text", required: true },
          { name: "Order Type", type: "text", required: true },
          { name: "Order Date", type: "date", required: true },
          { name: "Physician Signature", type: "signature", required: true },
        ],
      },
      {
        id: "TEMP-004",
        name: "HIPAA Agreement",
        description: "HIPAA privacy and security agreement",
        category: "Compliance",
        fields: [
          { name: "Employee Name", type: "text", required: true },
          { name: "Position", type: "text", required: true },
          { name: "Training Date", type: "date", required: true },
          { name: "Employee Signature", type: "signature", required: true },
        ],
      },
    ]
  }

  async createTemplate(template: Omit<DocumentTemplate, "id">): Promise<DocumentTemplate> {
    const id = `TEMP-${Date.now()}`
    const newTemplate: DocumentTemplate = { ...template, id }
    // In production, save to database
    return newTemplate
  }
}

// Export singleton instance
export const signatureService = SignatureService.getInstance()
