// Quick fix script to verify pending documents
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPendingDocuments() {
  try {
    console.log('Checking for pending documents...')
    
    // Get all pending documents
    const { data: pendingDocs, error: fetchError } = await supabase
      .from('applicant_documents')
      .select('*')
      .eq('status', 'pending')

    if (fetchError) {
      console.error('Error fetching documents:', fetchError)
      return
    }

    console.log(`Found ${pendingDocs?.length || 0} pending documents`)

    if (pendingDocs && pendingDocs.length > 0) {
      // Update all pending documents to verified
      const { data: updatedDocs, error: updateError } = await supabase
        .from('applicant_documents')
        .update({
          status: 'verified',
          verified_date: new Date().toISOString(),
          verified_by: 'system',
          notes: 'Auto-verified by system fix',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'pending')
        .select('*')

      if (updateError) {
        console.error('Error updating documents:', updateError)
        return
      }

      console.log(`✅ Successfully verified ${updatedDocs?.length || 0} documents`)
      console.log('Updated documents:', updatedDocs)
    } else {
      console.log('No pending documents found')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

fixPendingDocuments()
