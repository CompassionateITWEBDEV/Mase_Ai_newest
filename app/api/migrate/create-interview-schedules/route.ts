import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Creating interview_schedules table...')

    // Create the interview_schedules table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS interview_schedules (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
        applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
        employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
        interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
        interview_type VARCHAR(50) NOT NULL DEFAULT 'video',
        interview_location TEXT,
        meeting_link TEXT,
        interview_notes TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        duration_minutes INTEGER DEFAULT 60,
        interviewer_name VARCHAR(255),
        interviewer_email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES staff(id) ON DELETE SET NULL
      );
    `

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableQuery })

    if (createError) {
      console.error('Error creating table:', createError)
      return NextResponse.json(
        { error: 'Failed to create interview_schedules table: ' + createError.message },
        { status: 500 }
      )
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_interview_schedules_job_posting_id ON interview_schedules(job_posting_id);',
      'CREATE INDEX IF NOT EXISTS idx_interview_schedules_applicant_id ON interview_schedules(applicant_id);',
      'CREATE INDEX IF NOT EXISTS idx_interview_schedules_employer_id ON interview_schedules(employer_id);',
      'CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON interview_schedules(status);',
      'CREATE INDEX IF NOT EXISTS idx_interview_schedules_date ON interview_schedules(interview_date);'
    ]

    for (const indexQuery of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexQuery })
      if (indexError) {
        console.error('Error creating index:', indexError)
        // Continue with other indexes even if one fails
      }
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;' 
    })

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError)
    }

    // Create RLS policies
    const policies = [
      `CREATE POLICY "Employers can view their interview schedules" ON interview_schedules
        FOR SELECT USING (employer_id = auth.uid()::text OR 
                         employer_id IN (SELECT id FROM employers WHERE auth_user_id = auth.uid()));`,
      
      `CREATE POLICY "Employers can create interview schedules" ON interview_schedules
        FOR INSERT WITH CHECK (employer_id IN (SELECT id FROM employers WHERE auth_user_id = auth.uid()));`,
      
      `CREATE POLICY "Employers can update their interview schedules" ON interview_schedules
        FOR UPDATE USING (employer_id IN (SELECT id FROM employers WHERE auth_user_id = auth.uid()));`,
      
      `CREATE POLICY "Applicants can view their interview schedules" ON interview_schedules
        FOR SELECT USING (applicant_id IN (SELECT id FROM applicants WHERE auth_user_id = auth.uid()));`,
      
      `CREATE POLICY "Staff can view all interview schedules" ON interview_schedules
        FOR SELECT USING (auth.role() = 'service_role' OR 
                         created_by IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));`,
      
      `CREATE POLICY "Staff can create interview schedules" ON interview_schedules
        FOR INSERT WITH CHECK (auth.role() = 'service_role' OR 
                              created_by IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));`,
      
      `CREATE POLICY "Staff can update interview schedules" ON interview_schedules
        FOR UPDATE USING (auth.role() = 'service_role' OR 
                         created_by IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));`
    ]

    for (const policyQuery of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policyQuery })
      if (policyError) {
        console.error('Error creating policy:', policyError)
        // Continue with other policies even if one fails
      }
    }

    console.log('✅ Interview schedules table created successfully!')

    return NextResponse.json({
      success: true,
      message: 'Interview schedules table created successfully!'
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

















