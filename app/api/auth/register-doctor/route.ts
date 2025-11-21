import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    console.log('🏥 [DOCTOR REGISTRATION] Starting registration process...')
    
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      password,
      npi,
      dea,
      specialty,
      licenseNumber,
      licenseState,
      licenseExpiration,
      yearsExperience,
      bio,
      hourlyRate
    } = body

    console.log('📋 [DOCTOR REGISTRATION] Received data:', {
      firstName,
      lastName,
      email,
      npi,
      specialty,
      licenseState,
      licenseExpiration,
      hasPassword: !!password,
      hasDEA: !!dea,
      hasBio: !!bio,
    })

    // Validation
    if (!firstName || !lastName || !email || !password || !npi || !specialty || !licenseNumber || !licenseState || !licenseExpiration) {
      console.log('❌ [DOCTOR REGISTRATION] Validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields (including license expiration)' },
        { status: 400 }
      )
    }

    // Validate NPI format (should be 10 digits)
    console.log('🔍 [DOCTOR REGISTRATION] Validating NPI format:', npi)
    if (!/^\d{10}$/.test(npi)) {
      console.log('❌ [DOCTOR REGISTRATION] Invalid NPI format:', npi)
      return NextResponse.json(
        { error: 'NPI must be 10 digits' },
        { status: 400 }
      )
    }

    // Validate email format
    console.log('🔍 [DOCTOR REGISTRATION] Validating email format:', email)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('❌ [DOCTOR REGISTRATION] Invalid email format:', email)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    console.log('🔍 [DOCTOR REGISTRATION] Validating password length')
    if (password.length < 6) {
      console.log('❌ [DOCTOR REGISTRATION] Password too short')
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    console.log('✅ [DOCTOR REGISTRATION] All validations passed')
    console.log('🔌 [DOCTOR REGISTRATION] Connecting to database...')
    const supabase = createServiceClient()

    // Check if email already exists
    console.log('🔍 [DOCTOR REGISTRATION] Checking for duplicate email:', email)
    const { data: existingEmail } = await supabase
      .from('physicians')
      .select('email')
      .eq('email', email)
      .single()

    if (existingEmail) {
      console.log('❌ [DOCTOR REGISTRATION] Email already exists:', email)
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }
    console.log('✅ [DOCTOR REGISTRATION] Email is unique')

    // Check if NPI already exists
    console.log('🔍 [DOCTOR REGISTRATION] Checking for duplicate NPI:', npi)
    const { data: existingNPI } = await supabase
      .from('physicians')
      .select('npi')
      .eq('npi', npi)
      .single()

    if (existingNPI) {
      console.log('❌ [DOCTOR REGISTRATION] NPI already exists:', npi)
      return NextResponse.json(
        { error: 'NPI already registered' },
        { status: 400 }
      )
    }
    console.log('✅ [DOCTOR REGISTRATION] NPI is unique')

    // Insert new doctor
    // Note: In production, password should be hashed with bcrypt
    console.log('💾 [DOCTOR REGISTRATION] Inserting new doctor into database...')
    const doctorData = {
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      password_hash: password, // TODO: Hash with bcrypt in production
      npi: npi,
      dea_number: dea || null,
      specialty: specialty,
      license_number: licenseNumber,
      license_state: licenseState,
      license_expiration: licenseExpiration,
      years_experience: yearsExperience ? parseInt(yearsExperience) : null,
      bio: bio || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : 125.00,
      telehealth_enabled: true,
      is_available: false, // Doctor must manually set availability
      availability_mode: 'immediate',
      is_active: false, // Will use this until account_status column is added
      verification_status: 'pending', // Requires admin verification
      created_at: new Date().toISOString()
    }
    
    // Try to add account_status if column exists
    try {
      const { data: testColumn } = await supabase
        .from('physicians')
        .select('account_status')
        .limit(1)
        .single()
      
      if (testColumn && 'account_status' in testColumn) {
        doctorData.account_status = 'pending'
      }
    } catch (e) {
      // Column doesn't exist yet, continue without it
      console.log('ℹ️ [DOCTOR REGISTRATION] account_status column not found, using is_active')
    }
    
    console.log('📝 [DOCTOR REGISTRATION] Doctor data to insert:', {
      ...doctorData,
      password_hash: '[HIDDEN]'
    })
    
    const { data: newDoctor, error: insertError } = await supabase
      .from('physicians')
      .insert(doctorData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ [DOCTOR REGISTRATION] Database insert error:', insertError)
      console.error('❌ [DOCTOR REGISTRATION] Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      return NextResponse.json(
        { error: 'Failed to create doctor account: ' + insertError.message },
        { status: 500 }
      )
    }

    console.log('✅ [DOCTOR REGISTRATION] Doctor successfully inserted into database!')
    console.log('🎉 [DOCTOR REGISTRATION] New doctor created:', {
      id: newDoctor.id,
      name: `Dr. ${firstName} ${lastName}`,
      email: email,
      npi: npi,
      specialty: specialty
    })

    return NextResponse.json({
      success: true,
      message: 'Doctor account created successfully! Your account is pending admin verification. You will be able to login once approved.',
      doctor: {
        id: newDoctor.id,
        name: `Dr. ${firstName} ${lastName}`,
        email: email,
        npi: npi,
        specialty: specialty,
        status: 'pending_verification'
      }
    })

  } catch (error: any) {
    console.error('❌ [DOCTOR REGISTRATION] Unexpected error occurred:', error)
    console.error('❌ [DOCTOR REGISTRATION] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}

