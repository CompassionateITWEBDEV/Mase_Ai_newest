import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Adding password_hash columns using direct SQL...')

    // Try to add columns by attempting to insert a test record and catching the error
    // This is a workaround since we can't use exec_sql
    
    // First, let's check if the columns already exist by trying to select them
    const { data: applicantsCheck, error: applicantsError } = await supabase
      .from('applicants')
      .select('password_hash')
      .limit(1)

    const { data: employersCheck, error: employersError } = await supabase
      .from('employers')
      .select('password_hash')
      .limit(1)

    const { data: staffCheck, error: staffError } = await supabase
      .from('staff')
      .select('password_hash')
      .limit(1)

    const results = {
      applicants: !applicantsError,
      employers: !employersError,
      staff: !staffError
    }

    console.log('Column existence check:', results)

    if (results.applicants && results.employers && results.staff) {
      return NextResponse.json({
        success: true,
        message: 'Password hash columns already exist!',
        columns: results
      })
    }

    // If columns don't exist, we need to add them manually
    // For now, let's return instructions for manual addition
    return NextResponse.json({
      success: false,
      message: 'Password hash columns need to be added manually. Please run the SQL in scripts/038-add-password-hash-manual.sql in your Supabase SQL Editor.',
      instructions: [
        '1. Go to your Supabase dashboard',
        '2. Navigate to SQL Editor',
        '3. Run the SQL from scripts/038-add-password-hash-manual.sql',
        '4. The columns will be added to applicants, employers, and staff tables'
      ],
      columns: results
    })

  } catch (error: any) {
    console.error('Migration check failed:', error)
    return NextResponse.json(
      { error: error.message || 'Migration check failed' },
      { status: 500 }
    )
  }
}






