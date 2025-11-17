import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Singleton Supabase client for serverless
let serviceClient: any = null

function getServiceClient() {
  if (!serviceClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration")
    }
    
    serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return serviceClient
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const referralData = await request.json()
    const supabase = getServiceClient()

    // Validate required fields
    if (!referralData.patientInitials || !referralData.diagnosis || !referralData.insuranceProvider) {
      return NextResponse.json(
        { error: "Missing required fields: patientInitials, diagnosis, insuranceProvider" },
        { status: 400 }
      )
    }

    // Get or create facility user
    const { data: facilityUser } = await supabase
      .from('facility_users')
      .select('id, facility_name')
      .eq('facility_name', referralData.facilityName || 'Mercy Hospital')
      .single()

    // ❌ AUTO-APPROVE DISABLED - All referrals go to "Pending" for manual review
    // This ensures proper workflow: Submit → Pending → Manual Review → Approve/Deny
    const autoApprove = false

    // Generate referral number
    const referralNumber = `REF-${Date.now()}`

    // Create referral in database
    const { data: newReferral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referral_number: referralNumber,
        patient_name: referralData.patientInitials,
        referral_date: new Date().toISOString().split('T')[0],
        referral_source: facilityUser?.facility_name || 'Mercy Hospital',
        referral_type: 'standard', // Standard referral from facility portal
        diagnosis: referralData.diagnosis,
        clinical_summary: referralData.notes || `Patient referred for: ${referralData.services?.join(', ') || 'home health services'}. Diagnosis: ${referralData.diagnosis}`,
        insurance_provider: referralData.insuranceProvider,
        insurance_id: referralData.insuranceId || 'Pending',
        status: 'Pending', // ✅ ALL referrals start as "Pending" - awaiting manual review
        facility_user_id: facilityUser?.id,
        facility_name: facilityUser?.facility_name || 'Mercy Hospital',
        case_manager: referralData.caseManager || 'Not assigned',
        services: referralData.services || [],
        urgency: referralData.urgency || 'routine',
        ai_recommendation: 'Review', // AI will analyze, but human must approve
        ai_reason: 'Referral submitted - awaiting manual review and approval by MASE team'
      })
      .select()
      .single()

    if (referralError) {
      console.error('Error creating referral:', referralError)
      return NextResponse.json(
        { error: "Failed to create referral: " + referralError.message },
        { status: 500 }
      )
    }

    // Create notification message
    await supabase
      .from('facility_messages')
      .insert({
        from_type: 'system',
        from_name: 'M.A.S.E. System',
        to_type: 'facility',
        to_id: facilityUser?.id,
        to_name: facilityUser?.facility_name || 'Mercy Hospital',
        subject: `Referral ${referralNumber} Received - Pending Review`,
        content: `Your referral for ${referralData.patientInitials} has been received and is pending review by our team. You will be notified once the referral is approved or if additional information is needed.`,
        message_type: 'notification',
        referral_id: newReferral.id,
        priority: 'high' // High priority for new pending referrals
      })

    const response = {
      id: newReferral.id,
      referralNumber: referralNumber,
      status: "pending", // ✅ Always "pending" - awaiting manual approval
      message: "Referral received and is pending review by MASE team. You'll receive an update within 2 hours.",
      estimatedResponse: "2 hours",
      nextSteps: [
        "Insurance verification in progress", 
        "Clinical review scheduled", 
        "MASE team will contact with approval decision"
      ],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error processing referral:', error)
    return NextResponse.json(
      { error: "Failed to process referral: " + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facilityName = searchParams.get('facilityName') || 'Mercy Hospital'
    const supabase = getServiceClient()

    // Get referrals for this facility
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select(`
        id,
        referral_number,
        patient_name,
        diagnosis,
        status,
        referral_date,
        services,
        insurance_provider,
        facility_name,
        case_manager,
        urgency,
        estimated_admission_date,
        actual_admission_date,
        discharge_date,
        feedback,
        created_at
      `)
      .eq('facility_name', facilityName)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching referrals:', error)
      return NextResponse.json(
        { error: "Failed to fetch referrals: " + error.message },
        { status: 500 }
      )
    }

    // Transform data to match frontend expectations
    const transformedReferrals = (referrals || []).map(ref => ({
      id: ref.referral_number || ref.id,
      patientInitials: ref.patient_name,
      diagnosis: ref.diagnosis,
      status: ref.status.toLowerCase() === 'approved' ? 'accepted' : 
              ref.status.toLowerCase() === 'new' ? 'pending' :
              ref.status.toLowerCase(),
      submittedDate: ref.referral_date,
      services: ref.services || [],
      insuranceProvider: ref.insurance_provider,
      facilityName: ref.facility_name,
      caseManager: ref.case_manager,
      urgency: ref.urgency || 'routine',
      estimatedAdmissionDate: ref.estimated_admission_date,
      actualAdmissionDate: ref.actual_admission_date,
      dischargeDate: ref.discharge_date,
      feedback: ref.feedback
    }))

    return NextResponse.json(transformedReferrals)
  } catch (error) {
    console.error('Error in GET referrals:', error)
    return NextResponse.json(
      { error: "Failed to fetch referrals: " + (error as Error).message },
      { status: 500 }
    )
  }
}
