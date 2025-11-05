import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(_request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[API] Supabase credentials not configured')
      return NextResponse.json({ 
        success: true, 
        employees: [],
        warning: 'Supabase not configured'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get ONLY active staff members from staff table (not hired applicants)
    // This prevents duplicates when same person exists in both tables
    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select('id, name, email, role_id, department, credentials')
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (staffError) {
      console.error('[API] Database error fetching staff:', {
        message: staffError.message,
        code: staffError.code,
        details: staffError.details,
        hint: staffError.hint
      })
      
      // Return empty array with warning instead of crashing
      return NextResponse.json({ 
        success: true, 
        employees: [],
        warning: 'Unable to fetch staff members. Please check database connection.'
      })
    }

    // Map staff to employee format
    const employees = (staffList || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      role: s.credentials || s.role_id || 'Staff',
      department: s.department || 'General',
      email: s.email,
      source: 'staff',
    }))
    
    console.log(`[API] Fetched ${employees.length} staff members for assignments (staff table only, no applicants)`)

    return NextResponse.json({ 
      success: true, 
      employees,
      count: employees.length
    })
  } catch (error: any) {
    console.error('[API] Unexpected error in employees/list:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Return empty array with error info instead of crashing
    return NextResponse.json({ 
      success: true, 
      employees: [],
      error: error.message || 'Failed to load employees',
      warning: 'An error occurred while fetching employees. Please try again.'
    })
  }
}




