export interface WorkflowStep {
  id: string
  name: string
  description: string
  integration: string
  action: string
  parameters: Record<string, any>
  condition?: string
  onSuccess?: string
  onError?: string
  requiresApproval?: boolean
  approvalLevel?: "qa_rn" | "clinical_director" | "both"
  approvalRequired?: boolean
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  trigger: {
    type: "manual" | "event" | "schedule"
    event?: string
    schedule?: string
  }
  steps: WorkflowStep[]
  enabled: boolean
  requiresFinalApproval: boolean
  finalApprovalLevel: "qa_rn" | "clinical_director" | "both"
  complianceLevel: "standard" | "high" | "critical"
}

export interface ApprovalRecord {
  id: string
  workflowId: string
  stepId: string
  approverType: "qa_rn" | "clinical_director"
  approverId: string
  approverName: string
  approverCredentials: string
  approvalTimestamp: Date
  approvalComments?: string
  digitalSignature: string
  ipAddress: string
  deviceInfo: string
}

export class WorkflowOrchestrator {
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private executions: Map<string, WorkflowExecution> = new Map()
  private approvals: Map<string, ApprovalRecord[]> = new Map()

  constructor() {
    this.initializeDefaultWorkflows()
  }

  private initializeDefaultWorkflows() {
    const defaultWorkflows: WorkflowDefinition[] = [
      {
        id: "onboarding",
        name: "Employee Onboarding",
        description: "Automated onboarding sequence for new hires",
        trigger: {
          type: "event",
          event: "application.approved",
        },
        enabled: true,
        requiresFinalApproval: true,
        finalApprovalLevel: "clinical_director",
        complianceLevel: "critical",
        steps: [
          {
            id: "send-welcome-email",
            name: "Send Welcome Email",
            description: "Send welcome email to new employee",
            integration: "sendgrid",
            action: "send_email",
            parameters: {
              template: "welcome",
              personalizeData: true,
            },
            requiresApproval: false,
          },
          {
            id: "create-hr-file",
            name: "Create HR File",
            description: "Create employee record in HR system",
            integration: "supabase",
            action: "create_record",
            parameters: {
              table: "employees",
              includeDocuments: true,
            },
            requiresApproval: true,
            approvalLevel: "qa_rn",
          },
          {
            id: "schedule-orientation",
            name: "Schedule Orientation",
            description: "Schedule orientation session",
            integration: "calendar",
            action: "create_event",
            parameters: {
              duration: 120,
              type: "orientation",
            },
            requiresApproval: true,
            approvalLevel: "clinical_director",
          },
          {
            id: "assign-training",
            name: "Assign Training Modules",
            description: "Assign required training based on role",
            integration: "training",
            action: "assign_modules",
            parameters: {
              roleBasedAssignment: true,
            },
            requiresApproval: true,
            approvalLevel: "clinical_director",
          },
          {
            id: "setup-access",
            name: "Setup System Access",
            description: "Create user accounts and permissions",
            integration: "auth",
            action: "create_user",
            parameters: {
              roleBasedPermissions: true,
            },
            requiresApproval: true,
            approvalLevel: "clinical_director",
          },
          {
            id: "final-approval",
            name: "Final Onboarding Approval",
            description: "Clinical Director final approval for onboarding completion",
            integration: "approval",
            action: "final_approval",
            parameters: {
              approvalType: "onboarding_complete",
              documentationRequired: true,
            },
            requiresApproval: true,
            approvalLevel: "clinical_director",
            approvalRequired: true,
          },
        ],
      },
      {
        id: "compliance",
        name: "Compliance Monitoring",
        description: "Monitor and alert on compliance requirements",
        trigger: {
          type: "schedule",
          schedule: "0 9 * * *", // Daily at 9 AM
        },
        enabled: true,
        requiresFinalApproval: true,
        finalApprovalLevel: "both",
        complianceLevel: "critical",
        steps: [
          {
            id: "check-documents",
            name: "Check Document Expiration",
            description: "Check for expiring documents",
            integration: "supabase",
            action: "query_records",
            parameters: {
              table: "documents",
              filter: "expiring_soon",
            },
            requiresApproval: false,
          },
          {
            id: "check-training",
            name: "Check Training Status",
            description: "Check for overdue training",
            integration: "training",
            action: "check_status",
            parameters: {
              overdueOnly: true,
            },
            requiresApproval: false,
          },
          {
            id: "generate-compliance-report",
            name: "Generate Compliance Report",
            description: "Generate detailed compliance status report",
            integration: "reporting",
            action: "generate_report",
            parameters: {
              reportType: "compliance_summary",
              includeRecommendations: true,
            },
            requiresApproval: true,
            approvalLevel: "qa_rn",
          },
          {
            id: "send-alerts",
            name: "Send Compliance Alerts",
            description: "Send alerts for compliance issues",
            integration: "sendgrid",
            action: "send_email",
            parameters: {
              template: "compliance_alert",
              priority: "high",
            },
            condition: "has_compliance_issues",
            requiresApproval: true,
            approvalLevel: "clinical_director",
          },
          {
            id: "update-dashboard",
            name: "Update Compliance Dashboard",
            description: "Update compliance metrics",
            integration: "supabase",
            action: "update_metrics",
            parameters: {
              dashboard: "compliance",
            },
            requiresApproval: false,
          },
          {
            id: "final-compliance-approval",
            name: "Final Compliance Review",
            description: "Clinical Director and QA RN final approval of compliance status",
            integration: "approval",
            action: "dual_approval",
            parameters: {
              approvalType: "compliance_review",
              requiresBothApprovals: true,
            },
            requiresApproval: true,
            approvalLevel: "both",
            approvalRequired: true,
          },
        ],
      },
      {
        id: "background-check",
        name: "Background Check Process",
        description: "Automated background verification workflow",
        trigger: {
          type: "event",
          event: "application.submitted",
        },
        enabled: true,
        requiresFinalApproval: true,
        finalApprovalLevel: "clinical_director",
        complianceLevel: "critical",
        steps: [
          {
            id: "initiate-check",
            name: "Initiate Background Check",
            description: "Start background check with Sterling",
            integration: "sterling",
            action: "initiate_check",
            parameters: {
              services: ["criminal", "employment", "education"],
            },
            requiresApproval: true,
            approvalLevel: "qa_rn",
          },
          {
            id: "wait-for-results",
            name: "Wait for Results",
            description: "Monitor background check progress",
            integration: "sterling",
            action: "check_status",
            parameters: {
              pollInterval: 3600000, // 1 hour
              maxWaitTime: 172800000, // 48 hours
            },
            requiresApproval: false,
          },
          {
            id: "process-results",
            name: "Process Results",
            description: "Process background check results",
            integration: "supabase",
            action: "update_record",
            parameters: {
              table: "applications",
              field: "background_check_status",
            },
            requiresApproval: true,
            approvalLevel: "qa_rn",
          },
          {
            id: "clinical-review",
            name: "Clinical Review of Background Results",
            description: "Clinical Director reviews background check results",
            integration: "review",
            action: "clinical_assessment",
            parameters: {
              assessmentType: "background_suitability",
              requiresDocumentation: true,
            },
            requiresApproval: true,
            approvalLevel: "clinical_director",
          },
          {
            id: "notify-hr",
            name: "Notify HR Team",
            description: "Notify HR of background check completion",
            integration: "sendgrid",
            action: "send_email",
            parameters: {
              template: "background_check_complete",
              recipients: ["hr@company.com"],
            },
            requiresApproval: false,
          },
          {
            id: "final-background-approval",
            name: "Final Background Check Approval",
            description: "Clinical Director final approval for background clearance",
            integration: "approval",
            action: "final_approval",
            parameters: {
              approvalType: "background_clearance",
              requiresJustification: true,
            },
            requiresApproval: true,
            approvalLevel: "clinical_director",
            approvalRequired: true,
          },
        ],
      },
      {
        id: "oasis-qa",
        name: "OASIS Quality Assurance",
        description: "AI-powered OASIS quality review with clinical approval",
        trigger: {
          type: "event",
          event: "oasis.submitted",
        },
        enabled: true,
        requiresFinalApproval: true,
        finalApprovalLevel: "clinical_director",
        complianceLevel: "critical",
        steps: [
          {
            id: "ai-analysis",
            name: "AI Quality Analysis",
            description: "Automated AI quality assessment",
            integration: "ai-qa",
            action: "analyze_oasis",
            parameters: {
              includeComplianceCheck: true,
              flagThreshold: 85,
            },
            requiresApproval: false,
          },
          {
            id: "qa-rn-review",
            name: "QA RN Review",
            description: "QA RN validates AI findings and adds clinical judgment",
            integration: "qa-review",
            action: "clinical_validation",
            parameters: {
              requiresNotes: true,
              validateAIFindings: true,
            },
            requiresApproval: true,
            approvalLevel: "qa_rn",
          },
          {
            id: "clinical-director-review",
            name: "Clinical Director Final Review",
            description: "Clinical Director final approval of OASIS assessment",
            integration: "clinical-review",
            action: "final_assessment",
            parameters: {
              requiresSignature: true,
              complianceValidation: true,
            },
            requiresApproval: true,
            approvalLevel: "clinical_director",
            approvalRequired: true,
          },
          {
            id: "submit-to-axxess",
            name: "Submit to Axxess",
            description: "Submit approved OASIS to Axxess system",
            integration: "axxess",
            action: "submit_oasis",
            parameters: {
              includeApprovalTrail: true,
              digitalSignature: true,
            },
            requiresApproval: false,
          },
        ],
      },
      {
        id: "document-verification",
        name: "Document Verification Process",
        description: "Comprehensive document verification with clinical oversight",
        trigger: {
          type: "event",
          event: "document.uploaded",
        },
        enabled: true,
        requiresFinalApproval: true,
        finalApprovalLevel: "both",
        complianceLevel: "high",
        steps: [
          {
            id: "document-scan",
            name: "Document Scanning & OCR",
            description: "Scan and extract text from uploaded documents",
            integration: "ocr",
            action: "process_document",
            parameters: {
              includeMetadata: true,
              validateFormat: true,
            },
            requiresApproval: false,
          },
          {
            id: "qa-rn-verification",
            name: "QA RN Document Verification",
            description: "QA RN verifies document authenticity and completeness",
            integration: "verification",
            action: "verify_document",
            parameters: {
              checkExpiration: true,
              validateCredentials: true,
            },
            requiresApproval: true,
            approvalLevel: "qa_rn",
          },
          {
            id: "clinical-director-approval",
            name: "Clinical Director Document Approval",
            description: "Clinical Director final approval of document verification",
            integration: "approval",
            action: "approve_document",
            parameters: {
              requiresJustification: true,
              complianceCheck: true,
            },
            requiresApproval: true,
            approvalLevel: "clinical_director",
            approvalRequired: true,
          },
        ],
      },
    ]

    defaultWorkflows.forEach((workflow) => {
      this.workflows.set(workflow.id, workflow)
    })
  }

  async executeWorkflow(workflowId: string, context: Record<string, any> = {}): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow ${workflowId} is disabled`)
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: "running",
      startTime: new Date(),
      context,
      steps: [],
      logs: [],
      approvals: [],
      requiresFinalApproval: workflow.requiresFinalApproval,
      finalApprovalLevel: workflow.finalApprovalLevel,
      complianceLevel: workflow.complianceLevel,
    }

    this.executions.set(executionId, execution)
    this.logExecution(executionId, "Workflow execution started - Clinical approval required")

    try {
      for (const step of workflow.steps) {
        await this.executeStep(executionId, step, context)
      }

      // Check if final approval is required
      if (workflow.requiresFinalApproval) {
        const finalApprovalReceived = await this.checkFinalApproval(executionId, workflow.finalApprovalLevel)
        if (!finalApprovalReceived) {
          execution.status = "pending_approval"
          execution.pendingApprovalLevel = workflow.finalApprovalLevel
          this.logExecution(executionId, `Workflow pending final approval from: ${workflow.finalApprovalLevel}`)
          return execution
        }
      }

      execution.status = "completed"
      execution.endTime = new Date()
      this.logExecution(executionId, "Workflow execution completed successfully with clinical approval")
    } catch (error) {
      execution.status = "failed"
      execution.endTime = new Date()
      execution.error = error instanceof Error ? error.message : "Unknown error"
      this.logExecution(executionId, `Workflow execution failed: ${execution.error}`)
      throw error
    }

    return execution
  }

  private async executeStep(executionId: string, step: WorkflowStep, context: Record<string, any>): Promise<void> {
    const execution = this.executions.get(executionId)
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`)
    }

    // Check condition if specified
    if (step.condition && !this.evaluateCondition(step.condition, context)) {
      this.logExecution(executionId, `Step ${step.name} skipped due to condition: ${step.condition}`)
      return
    }

    this.logExecution(executionId, `Executing step: ${step.name}`)

    const stepExecution: StepExecution = {
      stepId: step.id,
      name: step.name,
      status: "running",
      startTime: new Date(),
      requiresApproval: step.requiresApproval || false,
      approvalLevel: step.approvalLevel,
    }

    execution.steps.push(stepExecution)

    try {
      // Check if step requires approval before execution
      if (step.requiresApproval && step.approvalLevel) {
        const approvalReceived = await this.requestStepApproval(executionId, step)
        if (!approvalReceived) {
          stepExecution.status = "pending_approval"
          stepExecution.pendingApprovalLevel = step.approvalLevel
          this.logExecution(executionId, `Step ${step.name} pending approval from: ${step.approvalLevel}`)
          return
        }
      }

      // Execute the step based on integration and action
      await this.callIntegration(step.integration, step.action, step.parameters, context)

      stepExecution.status = "completed"
      stepExecution.endTime = new Date()
      this.logExecution(executionId, `Step ${step.name} completed successfully`)

      // If this step required approval and is now complete, log the approval
      if (step.requiresApproval) {
        this.logExecution(executionId, `Step ${step.name} approved and executed by ${step.approvalLevel}`)
      }
    } catch (error) {
      stepExecution.status = "failed"
      stepExecution.endTime = new Date()
      stepExecution.error = error instanceof Error ? error.message : "Unknown error"
      this.logExecution(executionId, `Step ${step.name} failed: ${stepExecution.error}`)

      if (step.onError) {
        this.logExecution(executionId, `Executing error handler: ${step.onError}`)
      }

      throw error
    }
  }

  private async requestStepApproval(executionId: string, step: WorkflowStep): Promise<boolean> {
    // In a real implementation, this would send notifications to appropriate approvers
    // and wait for their response. For now, we'll simulate the approval process.

    this.logExecution(executionId, `Requesting ${step.approvalLevel} approval for step: ${step.name}`)

    // Simulate approval delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For demo purposes, assume approval is granted
    // In production, this would check actual approval status
    return true
  }

  private async checkFinalApproval(executionId: string, approvalLevel: string): Promise<boolean> {
    const execution = this.executions.get(executionId)
    if (!execution) return false

    // Check if required approvals have been received
    const requiredApprovals = approvalLevel === "both" ? ["qa_rn", "clinical_director"] : [approvalLevel]

    for (const required of requiredApprovals) {
      const hasApproval = execution.approvals?.some(
        (approval) => approval.approverType === required && approval.approvalTimestamp,
      )

      if (!hasApproval) {
        this.logExecution(executionId, `Missing required approval from: ${required}`)
        return false
      }
    }

    this.logExecution(executionId, "All required approvals received")
    return true
  }

  async submitApproval(
    executionId: string,
    approverType: "qa_rn" | "clinical_director",
    approverId: string,
    approverName: string,
    approverCredentials: string,
    comments?: string,
  ): Promise<boolean> {
    const execution = this.executions.get(executionId)
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`)
    }

    const approvalRecord: ApprovalRecord = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId: execution.workflowId,
      stepId: "final_approval",
      approverType,
      approverId,
      approverName,
      approverCredentials,
      approvalTimestamp: new Date(),
      approvalComments: comments,
      digitalSignature: this.generateDigitalSignature(approverId, executionId),
      ipAddress: "127.0.0.1", // In production, get actual IP
      deviceInfo: "Web Browser", // In production, get actual device info
    }

    if (!execution.approvals) {
      execution.approvals = []
    }
    execution.approvals.push(approvalRecord)

    this.logExecution(
      executionId,
      `Approval received from ${approverName} (${approverType}): ${comments || "No comments"}`,
    )

    // Check if workflow can now proceed
    const workflow = this.workflows.get(execution.workflowId)
    if (workflow && workflow.requiresFinalApproval) {
      const canProceed = await this.checkFinalApproval(executionId, workflow.finalApprovalLevel)
      if (canProceed) {
        execution.status = "completed"
        execution.endTime = new Date()
        this.logExecution(executionId, "Workflow completed with all required approvals")
      }
    }

    return true
  }

  private generateDigitalSignature(approverId: string, executionId: string): string {
    // In production, this would generate a proper digital signature
    const timestamp = Date.now()
    const data = `${approverId}-${executionId}-${timestamp}`
    return Buffer.from(data).toString("base64")
  }

  private async callIntegration(
    integration: string,
    action: string,
    parameters: Record<string, any>,
    context: Record<string, any>,
  ): Promise<any> {
    // Mock integration calls - in a real implementation, this would call actual APIs
    const delay = Math.random() * 1000 + 500 // Random delay between 500-1500ms
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Simulate different integration responses
    switch (integration) {
      case "sendgrid":
        return { messageId: `msg_${Date.now()}`, status: "sent" }
      case "supabase":
        return { recordId: `rec_${Date.now()}`, status: "created" }
      case "sterling":
        return { checkId: `bgc_${Date.now()}`, status: "initiated" }
      case "stripe":
        return { customerId: `cus_${Date.now()}`, status: "updated" }
      case "approval":
        return { approvalId: `app_${Date.now()}`, status: "pending_approval" }
      case "ai-qa":
        return { analysisId: `ai_${Date.now()}`, score: 87, flags: 3 }
      case "axxess":
        return { submissionId: `axx_${Date.now()}`, status: "submitted" }
      default:
        return { status: "completed" }
    }
  }

  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Simple condition evaluation - in a real implementation, use a proper expression evaluator
    switch (condition) {
      case "has_compliance_issues":
        return context.complianceIssues && context.complianceIssues.length > 0
      default:
        return true
    }
  }

  private logExecution(executionId: string, message: string): void {
    const execution = this.executions.get(executionId)
    if (execution) {
      execution.logs.push({
        timestamp: new Date(),
        message,
      })
    }
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId)
  }

  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId)
  }

  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }

  getPendingApprovals(approverType?: "qa_rn" | "clinical_director"): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter((execution) => {
      if (execution.status !== "pending_approval") return false

      if (approverType) {
        return execution.pendingApprovalLevel === approverType || execution.pendingApprovalLevel === "both"
      }

      return true
    })
  }

  getApprovalHistory(executionId: string): ApprovalRecord[] {
    const execution = this.executions.get(executionId)
    return execution?.approvals || []
  }
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: "running" | "completed" | "failed" | "pending_approval"
  startTime: Date
  endTime?: Date
  context: Record<string, any>
  steps: StepExecution[]
  logs: ExecutionLog[]
  error?: string
  approvals?: ApprovalRecord[]
  requiresFinalApproval?: boolean
  finalApprovalLevel?: string
  complianceLevel?: string
  pendingApprovalLevel?: string
}

export interface StepExecution {
  stepId: string
  name: string
  status: "running" | "completed" | "failed" | "pending_approval"
  startTime: Date
  endTime?: Date
  error?: string
  requiresApproval?: boolean
  approvalLevel?: string
  pendingApprovalLevel?: string
}

export interface ExecutionLog {
  timestamp: Date
  message: string
}

// Singleton instance
export const workflowOrchestrator = new WorkflowOrchestrator()
