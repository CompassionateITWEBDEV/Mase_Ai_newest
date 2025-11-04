import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Find applicant by email
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .maybeSingle()

    if (applicantError) {
      return NextResponse.json({ error: applicantError.message }, { status: 500 })
    }

    if (!applicant) {
      return NextResponse.json({ success: true, documents: [], note: 'No applicant found for email' })
    }

    // Fetch documents including optional expiration_date if present
    const { data: documents, error: docError } = await supabase
      .from('applicant_documents')
      .select('id, document_type, file_name, file_size, file_url, uploaded_date, status, verified_date, notes, applicant_id, expiration_date')
      .eq('applicant_id', applicant.id)
      .order('uploaded_date', { ascending: false })

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, applicant_id: applicant.id, documents: documents || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}




