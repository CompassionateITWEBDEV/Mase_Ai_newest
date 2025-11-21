import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('✅ [PHYSICIAN VERIFICATION] Starting credential verification for physician:', id)
    
    // Try to parse body, but it's optional for this endpoint
    let body = {}
    try {
      body = await request.json()
      console.log('📋 [PHYSICIAN VERIFICATION] Verification data:', body)
    } catch (e) {
      // No body is fine for this endpoint
      console.log('📋 [PHYSICIAN VERIFICATION] No request body (this is fine)')
    }
    
    const supabase = createServiceClient()

    // Update physician verification status ONLY (NOT activation)
    const { data, error } = await supabase
      .from('physicians')
      .update({
        verification_status: 'verified',
        last_verified: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ [PHYSICIAN VERIFICATION] Error updating physician:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [PHYSICIAN VERIFICATION] Credentials verified successfully:', {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email,
      verification_status: data.verification_status,
      is_active: data.is_active
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Physician credentials verified successfully. Account can now be activated.',
      physician: data 
    })
  } catch (error: any) {
    console.error('❌ [PHYSICIAN VERIFICATION] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to verify physician: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('⚠️ [PHYSICIAN VERIFICATION] Revoking verification for physician:', id)
    
    const supabase = createServiceClient()

    // Revoke verification status
    const { data, error } = await supabase
      .from('physicians')
      .update({
        verification_status: 'not_verified'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ [PHYSICIAN VERIFICATION] Error revoking verification:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [PHYSICIAN VERIFICATION] Verification revoked:', {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      verification_status: data.verification_status
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Physician verification revoked',
      physician: data 
    })
  } catch (error: any) {
    console.error('❌ [PHYSICIAN VERIFICATION] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke verification: ' + error.message },
      { status: 500 }
    )
  }
}

