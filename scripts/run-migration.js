const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Adding password_hash columns...')

  try {
    // Add password_hash column to applicants table
    const { error: applicantsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS password_hash TEXT;'
    })

    if (applicantsError) {
      console.error('Error adding password_hash to applicants:', applicantsError)
    } else {
      console.log('✅ Added password_hash column to applicants table')
    }

    // Add password_hash column to employers table
    const { error: employersError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS password_hash TEXT;'
    })

    if (employersError) {
      console.error('Error adding password_hash to employers:', employersError)
    } else {
      console.log('✅ Added password_hash column to employers table')
    }

    // Add password_hash column to staff table
    const { error: staffError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS password_hash TEXT;'
    })

    if (staffError) {
      console.error('Error adding password_hash to staff:', staffError)
    } else {
      console.log('✅ Added password_hash column to staff table')
    }

    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()









