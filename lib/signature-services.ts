// Digital signature service integration
export interface SignatureRequest {
  id: string
  documentName: string
  recipients: SignatureRecipient[]
  status: "draft" | "sent" | "completed" | "cancelled"
  createdAt: string
  completedAt?: string
  expiresAt: string
}

export interface SignatureRecipient {
  name: string
  email: string
  role: string
  status: "pending" | "viewed" | "signed" | "declined"
  signedAt?: string
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

// Mock signature service - in production, integrate with DocuSign, Adobe Sign, etc.
export class SignatureService {
  private static instance: SignatureService
  private requests: Map<string, SignatureRequest> = new Map()

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
  ): Promise<SignatureRequest> {
    const id = `SIG-${Date.now()}`
    const request: SignatureRequest = {
      id,
      documentName,
      recipients: recipients.map((r) => ({ ...r, status: "pending" })),
      status: "draft",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    }

    this.requests.set(id, request)
    return request
  }

  async sendForSignature(requestId: string): Promise<void> {
    const request = this.requests.get(requestId)
    if (!request) {
      throw new Error("Signature request not found")
    }

    request.status = "sent"
    // In production, this would send emails to recipients
    console.log(`Sending signature request ${requestId} to recipients`)
  }

  async getSignatureRequest(requestId: string): Promise<SignatureRequest | null> {
    return this.requests.get(requestId) || null
  }

  async updateRecipientStatus(
    requestId: string,
    recipientEmail: string,
    status: SignatureRecipient["status"],
  ): Promise<void> {
    const request = this.requests.get(requestId)
    if (!request) {
      throw new Error("Signature request not found")
    }

    const recipient = request.recipients.find((r) => r.email === recipientEmail)
    if (!recipient) {
      throw new Error("Recipient not found")
    }

    recipient.status = status
    if (status === "signed") {
      recipient.signedAt = new Date().toISOString()
    }

    // Check if all recipients have signed
    const allSigned = request.recipients.every((r) => r.status === "signed")
    if (allSigned) {
      request.status = "completed"
      request.completedAt = new Date().toISOString()
    }
  }

  async getAllRequests(): Promise<SignatureRequest[]> {
    return Array.from(this.requests.values())
  }

  async cancelRequest(requestId: string): Promise<void> {
    const request = this.requests.get(requestId)
    if (!request) {
      throw new Error("Signature request not found")
    }

    request.status = "cancelled"
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
