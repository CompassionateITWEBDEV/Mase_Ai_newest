import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('📧 [ADD CREDENTIALS] Adding credentials for physician:', id)
    
    const body = await request.json()
    const { email, password, activate } = body
    
    // Validation
    if (!email || !password) {
      console.log('❌ [ADD CREDENTIALS] Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('❌ [ADD CREDENTIALS] Invalid email format:', email)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Validate password length
    if (password.length < 6) {
      console.log('❌ [ADD CREDENTIALS] Password too short')
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }
    
    const supabase = createServiceClient()
    
    // Check if email already used by another physician
    console.log('🔍 [ADD CREDENTIALS] Checking for duplicate email:', email)
    const { data: existingEmail } = await supabase
      .from('physicians')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .neq('id', id)
      .single()
    
    if (existingEmail) {
      console.log('❌ [ADD CREDENTIALS] Email already in use by:', existingEmail.first_name, existingEmail.last_name)
      return NextResponse.json(
        { error: `Email already in use by Dr. ${existingEmail.first_name} ${existingEmail.last_name}` },
        { status: 400 }
      )
    }
    
    console.log('✅ [ADD CREDENTIALS] Email is unique')
    
    // Update physician with credentials
    const updateData: any = {
      email: email.toLowerCase(),
      password_hash: password, // TODO: Hash with bcrypt in production
      telehealth_enabled: true,
      is_available: false,
      availability_mode: 'immediate',
    }
    
    // Check if account_status column exists
    const { data: testColumn } = await supabase
      .from('physicians')
      .select('account_status')
      .limit(1)
      .single()
    
    const hasAccountStatus = testColumn && 'account_status' in testColumn
    
    // If activate flag is true, also activate account
    if (activate) {
      console.log('✅ [ADD CREDENTIALS] Activating account as well')
      if (hasAccountStatus) {
        updateData.account_status = 'active'
      } else {
        updateData.is_active = true
      }
      updateData.last_verified = new Date().toISOString()
    } else {
      // Set to pending if not activating immediately
      if (hasAccountStatus) {
        updateData.account_status = 'pending'
      }
    }
    
    console.log('💾 [ADD CREDENTIALS] Updating physician record...')
    const { data, error } = await supabase
      .from('physicians')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ [ADD CREDENTIALS] Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ [ADD CREDENTIALS] Success! Updated physician:', {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email,
      account_status: data.account_status || (data.is_active ? 'active' : 'inactive'),
      verification_status: data.verification_status
    })
    
    return NextResponse.json({
      success: true,
      message: activate 
        ? 'Credentials added and account activated successfully! Doctor can now login.'
        : 'Credentials added successfully',
      physician: {
        id: data.id,
        name: `Dr. ${data.first_name} ${data.last_name}`,
        email: data.email,
        account_status: data.account_status || (data.is_active ? 'active' : 'inactive')
      }
    })
  } catch (error: any) {
    console.error('❌ [ADD CREDENTIALS] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to add credentials: ' + error.message },
      { status: 500 }
    )
  }
}

