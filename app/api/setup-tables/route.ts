import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Read the SQL migration file
    const sqlPath = path.join(process.cwd(), 'scripts', '005-create-job-portal-tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()
    
    if (error) {
      // If RPC doesn't exist, return the SQL for manual execution
      return NextResponse.json({ 
        success: false, 
        message: 'Please run this SQL in Supabase SQL Editor',
        sql: sql,
        dashboardUrl: `https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].replace('https://', '')}/sql/new`
      })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: 'Could not auto-execute migration. Please run the SQL manually in Supabase SQL Editor.'
    }, { status: 500 })
  }
}

