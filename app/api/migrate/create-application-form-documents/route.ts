import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Read the SQL file
    const sqlFilePath = join(process.cwd(), 'scripts', '046-create-application-form-documents-table.sql')
    const sql = readFileSync(sqlFilePath, 'utf-8')

    console.log('Creating application_form_documents table...')

    // Execute the SQL using rpc if available, otherwise use direct query
    // Note: This requires exec_sql function to be available in Supabase
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: sql
    })

    if (tableError) {
      console.error('Table creation error:', tableError)
      
      // If exec_sql is not available, return instructions
      if (tableError.message?.includes('exec_sql') || tableError.message?.includes('function') || tableError.code === '42883') {
        return NextResponse.json({
          success: false,
          error: 'exec_sql function not available',
          message: 'Please run the SQL script manually in Supabase SQL Editor',
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy and paste the SQL from scripts/046-create-application-form-documents-table.sql',
            '4. Execute the SQL script',
            '5. The application_form_documents table will be created'
          ],
          sqlFile: 'scripts/046-create-application-form-documents-table.sql'
        }, { status: 400 })
      }

      return NextResponse.json(
        { error: 'Failed to create application_form_documents table: ' + tableError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Application form documents table created successfully'
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if table exists
    const { data, error } = await supabase
      .from('application_form_documents')
      .select('id')
      .limit(1)

    if (error && error.code === '42P01') {
      return NextResponse.json({
        exists: false,
        message: 'application_form_documents table does not exist. Run POST to create it.'
      })
    }

    return NextResponse.json({
      exists: !error,
      message: error ? 'Error checking table: ' + error.message : 'application_form_documents table exists'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

