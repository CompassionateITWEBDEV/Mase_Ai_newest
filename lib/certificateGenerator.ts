/**
 * Certificate Generator Utility
 * Generates unique certificate IDs and manages certificate data
 */

export interface CertificateData {
  certificateId: string
  staffId: string
  staffName: string
  trainingId: string
  trainingTitle: string
  completionDate: string
  ceuHours?: number
  score?: number
  organizationName?: string
}

/**
 * Generate a unique certificate ID
 */
export function generateCertificateId(staffId: string, trainingId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  const prefix = "CERT"
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Create certificate data object
 */
export function createCertificateData(
  staffId: string,
  staffName: string,
  trainingId: string,
  trainingTitle: string,
  ceuHours?: number,
  score?: number
): CertificateData {
  return {
    certificateId: generateCertificateId(staffId, trainingId),
    staffId,
    staffName,
    trainingId,
    trainingTitle,
    completionDate: new Date().toISOString(),
    ceuHours,
    score,
    organizationName: "M.A.S.E Healthcare",
  }
}

/**
 * Format certificate ID for display
 */
export function formatCertificateId(certificateId: string): string {
  return certificateId.replace(/-/g, " ")
}

/**
 * Validate certificate ID format
 */
export function isValidCertificateId(certificateId: string): boolean {
  return /^CERT-\d{13}-[A-Z0-9]{6}$/.test(certificateId)
}

