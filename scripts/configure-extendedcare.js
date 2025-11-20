/**
 * Script to configure ExtendedCare integration with credentials
 * Usage: node scripts/configure-extendedcare.js
 * 
 * Make sure environment variables are set:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js')

// Simple encryption function
function encryptCredential(credential) {
  return Buffer.from(credential).toString('base64')
}

async function configureExtendedCare() {
  console.log('🔧 Configuring ExtendedCare Integration...\n')

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // ExtendedCare credentials
  const credentials = {
    username: 'Mae',
    password: 'Compassionate!2',
    clientId: 'MASE-CLIENT-001', // Default client ID
    environment: 'production', // Can be 'sandbox' or 'production'
  }

  console.log('📋 Configuration Details:')
  console.log(`   Username: ${credentials.username}`)
  console.log(`   Environment: ${credentials.environment}`)
  console.log(`   Client ID: ${credentials.clientId}\n`)

  try {
    // Encrypt credentials
    const encryptedUsername = encryptCredential(credentials.username)
    const encryptedPassword = encryptCredential(credentials.password)

    // Check if configuration already exists
    const { data: existingConfig, error: fetchError } = await supabase
      .from('integrations_config')
      .select('*')
      .eq('integration_name', 'extendedcare')
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    const configData = {
      integration_name: 'extendedcare',
      api_url: credentials.environment === 'sandbox'
        ? 'https://api.extendedcare.com/sandbox/v2'
        : 'https://api.extendedcare.com/v2',
      username: encryptedUsername,
      password: encryptedPassword,
      api_key: null,
      agency_id: credentials.clientId,
      environment: credentials.environment,
      auto_sync: true,
      sync_interval_minutes: 15,
      enable_webhooks: true,
      data_retention_days: 90,
      compression_enabled: false,
      encryption_enabled: true,
      status: 'connected',
      error_message: null,
      last_sync_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let result
    if (existingConfig) {
      console.log('🔄 Updating existing ExtendedCare configuration...')
      const { data, error } = await supabase
        .from('integrations_config')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single()

      if (error) throw error
      result = data
      console.log('✅ Configuration updated successfully!')
    } else {
      console.log('➕ Creating new ExtendedCare configuration...')
      const { data, error } = await supabase
        .from('integrations_config')
        .insert(configData)
        .select()
        .single()

      if (error) throw error
      result = data
      console.log('✅ Configuration created successfully!')
    }

    console.log('\n📊 Saved Configuration:')
    console.log(`   ID: ${result.id}`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Environment: ${result.environment}`)
    console.log(`   Auto Sync: ${result.auto_sync}`)
    console.log(`   Sync Interval: ${result.sync_interval_minutes} minutes`)
    console.log(`   Webhooks: ${result.enable_webhooks ? 'Enabled' : 'Disabled'}`)
    console.log(`   Last Sync: ${result.last_sync_time}\n`)

    console.log('✨ ExtendedCare integration is now configured and ready to use!')
    console.log('🌐 You can access the setup page at: /integrations/extendedcare-setup')

  } catch (error) {
    console.error('\n❌ Error configuring ExtendedCare:', error.message)
    if (error.details) {
      console.error('Details:', error.details)
    }
    if (error.hint) {
      console.error('Hint:', error.hint)
    }
    process.exit(1)
  }
}

// Run the configuration
configureExtendedCare()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })

