import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔓 [PHYSICIAN ACTIVATION] Starting activation for physician:', id)
    
    const supabase = createServiceClient()

    // First, check if physician exists and has credentials
    const { data: physician, error: fetchError } = await supabase
      .from('physicians')
      .select('id, first_name, last_name, email, password_hash, is_active')
      .eq('id', id)
      .single()

    if (fetchError || !physician) {
      console.error('❌ [PHYSICIAN ACTIVATION] Physician not found:', fetchError)
      return NextResponse.json({ error: 'Physician not found' }, { status: 404 })
    }

    // Check if physician has credentials
    if (!physician.email || !physician.password_hash) {
      console.error('❌ [PHYSICIAN ACTIVATION] Missing credentials for physician:', id)
      return NextResponse.json({ 
        error: 'Cannot activate account without email and password. Please add credentials first.',
        missingCredentials: true
      }, { status: 400 })
    }

    // Try to activate using account_status, fallback to is_active if column doesn't exist
    let updateData: any = {
      last_verified: new Date().toISOString()
    }
    
    // Try account_status first (new column)
    const { data: testData } = await supabase
      .from('physicians')
      .select('account_status')
      .limit(1)
      .single()
    
    if (testData && 'account_status' in testData) {
      // New column exists
      updateData.account_status = 'active'
    } else {
      // Fallback to old column
      updateData.is_active = true
    }

    const { data, error } = await supabase
      .from('physicians')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ [PHYSICIAN ACTIVATION] Error activating physician:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [PHYSICIAN ACTIVATION] Physician activated successfully:', {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email,
      account_status: data.account_status || data.is_active
    })

    // TODO: Send activation email notification to doctor
    console.log('📧 [PHYSICIAN ACTIVATION] TODO: Send activation email to:', data.email)

    return NextResponse.json({ 
      success: true, 
      message: 'Physician account activated successfully',
      physician: data 
    })
  } catch (error: any) {
    console.error('❌ [PHYSICIAN ACTIVATION] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to activate physician: ' + error.message },
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
    console.log('🔒 [PHYSICIAN ACTIVATION] Deactivating physician:', id)
    
    const supabase = createServiceClient()

    // Check if account_status column exists
    const { data: testData } = await supabase
      .from('physicians')
      .select('account_status')
      .limit(1)
      .single()
    
    let updateData: any = {}
    if (testData && 'account_status' in testData) {
      updateData.account_status = 'inactive'
    } else {
      updateData.is_active = false
    }

    // Deactivate physician
    const { data, error } = await supabase
      .from('physicians')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ [PHYSICIAN ACTIVATION] Error deactivating physician:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [PHYSICIAN ACTIVATION] Physician deactivated:', {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      account_status: data.account_status || data.is_active
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Physician deactivated successfully',
      physician: data 
    })
  } catch (error: any) {
    console.error('❌ [PHYSICIAN ACTIVATION] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate physician: ' + error.message },
      { status: 500 }
    )
  }
}

