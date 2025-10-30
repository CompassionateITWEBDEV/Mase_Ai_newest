import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(_request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get all applicant_ids that are marked as hired (status: accepted)
    const { data: hiredApps, error: appsError } = await supabase
      .from('job_applications')
      .select('applicant_id')
      .in('status', ['accepted', 'hired'])

    if (appsError) {
      return NextResponse.json({ success: false, error: appsError.message }, { status: 500 })
    }

    const applicantIds = Array.from(new Set((hiredApps || []).map(a => a.applicant_id).filter(Boolean)))

    if (applicantIds.length === 0) {
      return NextResponse.json({ success: true, employees: [] })
    }

    const { data: applicants, error: applicantsError } = await supabase
      .from('applicants')
      .select('id, first_name, last_name, email, phone, profession, city, state')
      .in('id', applicantIds as string[])

    if (applicantsError) {
      return NextResponse.json({ success: false, error: applicantsError.message }, { status: 500 })
    }

    const employees = (applicants || []).map(a => ({
      id: a.id,
      name: `${a.first_name} ${a.last_name}`.trim(),
      email: a.email,
      phone: a.phone,
      profession: a.profession,
      location: [a.city, a.state].filter(Boolean).join(', '),
    }))

    return NextResponse.json({ success: true, employees })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load employees' }, { status: 500 })
  }
}


