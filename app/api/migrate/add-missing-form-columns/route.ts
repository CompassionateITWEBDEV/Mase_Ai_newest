import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Add missing columns one by one
    const columns = [
      'additional_info TEXT',
      'license_number TEXT',
      'cpr_certification TEXT',
      'other_certifications TEXT',
      'background_check_consent BOOLEAN DEFAULT false',
      'drug_test_consent BOOLEAN DEFAULT false',
      'immunization_records BOOLEAN DEFAULT false',
      'tb_test BOOLEAN DEFAULT false',
      'flu_vaccine BOOLEAN DEFAULT false',
      'covid_vaccine BOOLEAN DEFAULT false',
      'physical_limitations TEXT',
      'emergency_contact_name TEXT',
      'emergency_contact_phone TEXT',
      'emergency_contact_relationship TEXT',
      'reference1_name TEXT',
      'reference1_phone TEXT',
      'reference1_relationship TEXT',
      'reference2_name TEXT',
      'reference2_phone TEXT',
      'reference2_relationship TEXT',
      'reference3_name TEXT',
      'reference3_phone TEXT',
      'reference3_relationship TEXT'
    ]

    const results = []
    
    for (const column of columns) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: `ALTER TABLE public.application_forms ADD COLUMN IF NOT EXISTS ${column};` 
        })
        
        if (error) {
          results.push({ column, error: error.message })
        } else {
          results.push({ column, success: true })
        }
      } catch (err: any) {
        results.push({ column, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Missing columns added to application_forms table',
      results
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Please run the SQL script manually in Supabase SQL Editor'
    }, { status: 500 })
  }
}

