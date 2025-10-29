import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Fixing RLS policies for application_forms table...');

    // Read the SQL script
    const fs = require('fs');
    const path = require('path');
    const sqlScript = fs.readFileSync(
      path.join(process.cwd(), 'scripts', '042-fix-application-forms-rls.sql'),
      'utf8'
    );

    // Execute the SQL script
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });

    if (error) {
      console.error('❌ Error fixing RLS policies:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    console.log('✅ RLS policies fixed successfully for application_forms table');

    return NextResponse.json({
      success: true,
      message: 'RLS policies fixed successfully for application_forms table'
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

