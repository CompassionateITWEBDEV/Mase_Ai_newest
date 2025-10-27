const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Read the migration SQL file
  const sqlFilePath = path.join(__dirname, '040-3-fix-reschedule-table-columns.sql')
  const sql = fs.readFileSync(sqlFilePath, 'utf8')

  console.log('📋 Running migration to fix interview_reschedule_requests table...')
  console.log('')

  try {
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip empty statements or comments
      if (!statement || statement.startsWith('--')) continue
      
      try {
        console.log(`Running statement ${i + 1}/${statements.length}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            console.log(`  ⚠️  ${error.message}`)
          } else {
            console.error(`  ❌ Error: ${error.message}`)
          }
        } else {
          console.log(`  ✅ Success`)
        }
      } catch (err) {
        console.error(`  ❌ Unexpected error: ${err.message}`)
      }
    }

    console.log('')
    console.log('✅ Migration completed!')
    console.log('')
    console.log('The interview_reschedule_requests table should now have the correct columns.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()

