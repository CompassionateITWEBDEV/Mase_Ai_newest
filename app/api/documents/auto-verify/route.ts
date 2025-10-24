import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { documentId, documentType, fileName, fileContent } = await request.json()

    if (!documentId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId and documentType' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Automated verification logic based on document type
    let verificationResult = {
      status: 'pending',
      confidence: 0,
      reasons: [] as string[],
      notes: ''
    }

    // Resume verification
    if (documentType === 'resume') {
      verificationResult = verifyResume(fileName, fileContent)
    }
    
    // License verification
    else if (documentType === 'license') {
      verificationResult = verifyLicense(fileName, fileContent)
    }
    
    // Certification verification
    else if (documentType === 'certification') {
      verificationResult = verifyCertification(fileName, fileContent)
    }
    
    // Background check verification
    else if (documentType === 'background_check') {
      verificationResult = verifyBackgroundCheck(fileName, fileContent)
    }

    // Update document with verification result
    const updateData = {
      status: verificationResult.status,
      verified_date: verificationResult.status !== 'pending' ? new Date().toISOString() : null,
      notes: verificationResult.notes,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('applicant_documents')
      .update(updateData)
      .eq('id', documentId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating document verification:', error)
      return NextResponse.json(
        { error: 'Failed to update document verification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      document: data,
      verification: verificationResult,
      message: `Document verification completed with ${verificationResult.status} status`
    })

  } catch (error: any) {
    console.error('Document verification API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Resume verification logic
function verifyResume(fileName: string, content: string): any {
  const reasons: string[] = []
  let confidence = 0

  // Check file name
  if (fileName.toLowerCase().includes('resume') || fileName.toLowerCase().includes('cv')) {
    confidence += 20
    reasons.push('File name indicates resume/CV')
  }

  // Check content for resume keywords
  const resumeKeywords = ['experience', 'education', 'skills', 'objective', 'summary', 'work history', 'professional', 'career', 'employment']
  const foundKeywords = resumeKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword)
  )
  
  if (foundKeywords.length >= 2) {  // Lowered from 3 to 2
    confidence += 35  // Increased from 30 to 35
    reasons.push(`Contains ${foundKeywords.length} resume keywords`)
  }

  // Check for contact information
  const contactPatterns = [
    /@.*\.(com|org|net|edu)/, // Email
    /\(\d{3}\)\s*\d{3}-\d{4}/, // Phone
    /\d{5}(-\d{4})?/ // ZIP code
  ]
  
  const hasContactInfo = contactPatterns.some(pattern => pattern.test(content))
  if (hasContactInfo) {
    confidence += 25
    reasons.push('Contains contact information')
  }

  // Check for professional sections
  const professionalSections = ['work experience', 'employment', 'professional experience', 'career']
  const hasProfessionalSections = professionalSections.some(section => 
    content.toLowerCase().includes(section)
  )
  
  if (hasProfessionalSections) {
    confidence += 25
    reasons.push('Contains professional experience section')
  }

  let status = 'pending'
  if (confidence >= 50) {  // Lowered from 70 to 50 for easier auto-verification
    status = 'verified'
  } else if (confidence < 20) {  // Lowered from 30 to 20
    status = 'rejected'
  }

  return {
    status,
    confidence,
    reasons,
    notes: `Automated verification: ${confidence}% confidence. ${reasons.join(', ')}`
  }
}

// License verification logic
function verifyLicense(fileName: string, content: string): any {
  const reasons: string[] = []
  let confidence = 0

  // Check file name
  if (fileName.toLowerCase().includes('license') || fileName.toLowerCase().includes('rn') || fileName.toLowerCase().includes('lpn')) {
    confidence += 25
    reasons.push('File name indicates license document')
  }

  // Check for license keywords
  const licenseKeywords = ['license', 'registered nurse', 'rn', 'lpn', 'state board', 'nursing board', 'license number']
  const foundKeywords = licenseKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword)
  )
  
  if (foundKeywords.length >= 2) {
    confidence += 30
    reasons.push(`Contains ${foundKeywords.length} license keywords`)
  }

  // Check for license number pattern
  const licenseNumberPattern = /license\s*(number)?\s*:?\s*[A-Z0-9-]{5,15}/i
  if (licenseNumberPattern.test(content)) {
    confidence += 25
    reasons.push('Contains license number')
  }

  // Check for state board information
  const stateBoardPattern = /(state|board)\s+(of\s+)?nursing/i
  if (stateBoardPattern.test(content)) {
    confidence += 20
    reasons.push('Contains state nursing board information')
  }

  let status = 'pending'
  if (confidence >= 50) {  // Lowered from 70 to 50 for easier auto-verification
    status = 'verified'
  } else if (confidence < 20) {  // Lowered from 30 to 20
    status = 'rejected'
  }

  return {
    status,
    confidence,
    reasons,
    notes: `Automated verification: ${confidence}% confidence. ${reasons.join(', ')}`
  }
}

// Certification verification logic
function verifyCertification(fileName: string, content: string): any {
  const reasons: string[] = []
  let confidence = 0

  // Check file name
  if (fileName.toLowerCase().includes('cert') || fileName.toLowerCase().includes('cpr') || fileName.toLowerCase().includes('bls')) {
    confidence += 25
    reasons.push('File name indicates certification document')
  }

  // Check for certification keywords
  const certKeywords = ['certification', 'certificate', 'cpr', 'bls', 'acls', 'pals', 'expires', 'valid until']
  const foundKeywords = certKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword)
  )
  
  if (foundKeywords.length >= 2) {
    confidence += 30
    reasons.push(`Contains ${foundKeywords.length} certification keywords`)
  }

  // Check for expiration date
  const expirationPattern = /(expires?|valid until|expiration)\s*:?\s*\d{1,2}\/\d{1,2}\/\d{2,4}/i
  if (expirationPattern.test(content)) {
    confidence += 25
    reasons.push('Contains expiration date')
  }

  // Check for issuing organization
  const orgPattern = /(american heart association|red cross|aha|arc)/i
  if (orgPattern.test(content)) {
    confidence += 20
    reasons.push('Contains recognized issuing organization')
  }

  let status = 'pending'
  if (confidence >= 50) {  // Lowered from 70 to 50 for easier auto-verification
    status = 'verified'
  } else if (confidence < 20) {  // Lowered from 30 to 20
    status = 'rejected'
  }

  return {
    status,
    confidence,
    reasons,
    notes: `Automated verification: ${confidence}% confidence. ${reasons.join(', ')}`
  }
}

// Background check verification logic
function verifyBackgroundCheck(fileName: string, content: string): any {
  const reasons: string[] = []
  let confidence = 0

  // Check file name
  if (fileName.toLowerCase().includes('background') || fileName.toLowerCase().includes('criminal')) {
    confidence += 25
    reasons.push('File name indicates background check document')
  }

  // Check for background check keywords
  const bgKeywords = ['background check', 'criminal history', 'fingerprint', 'fbi', 'state police', 'clear']
  const foundKeywords = bgKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword)
  )
  
  if (foundKeywords.length >= 2) {
    confidence += 30
    reasons.push(`Contains ${foundKeywords.length} background check keywords`)
  }

  // Check for clearance status
  const clearancePattern = /(clear|no record|no criminal history|passed)/i
  if (clearancePattern.test(content)) {
    confidence += 25
    reasons.push('Indicates clear background')
  }

  // Check for date information
  const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}/
  if (datePattern.test(content)) {
    confidence += 20
    reasons.push('Contains date information')
  }

  let status = 'pending'
  if (confidence >= 50) {  // Lowered from 70 to 50 for easier auto-verification
    status = 'verified'
  } else if (confidence < 20) {  // Lowered from 30 to 20
    status = 'rejected'
  }

  return {
    status,
    confidence,
    reasons,
    notes: `Automated verification: ${confidence}% confidence. ${reasons.join(', ')}`
  }
}
