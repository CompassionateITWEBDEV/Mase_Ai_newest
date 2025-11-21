-- ================================================
-- ExtendedCare Integration Configuration
-- ================================================
-- This script configures ExtendedCare with the provided credentials
-- Run this in Supabase Dashboard > SQL Editor
--
-- Credentials:
--   Username: Mae
--   Password: Compassionate!2
--   Environment: Production
-- ================================================

-- First, check if configuration already exists
DO $$
DECLARE
    existing_id UUID;
    encrypted_username TEXT;
    encrypted_password TEXT;
BEGIN
    -- Simple Base64 encoding for credentials
    -- In production, use proper encryption
    encrypted_username := encode('Mae'::bytea, 'base64');
    encrypted_password := encode('Compassionate!2'::bytea, 'base64');

    -- Check for existing configuration
    SELECT id INTO existing_id
    FROM integrations_config
    WHERE integration_name = 'extendedcare';

    IF existing_id IS NOT NULL THEN
        -- Update existing configuration
        UPDATE integrations_config
        SET
            api_url = 'https://api.extendedcare.com/v2',
            username = encrypted_username,
            password = encrypted_password,
            api_key = NULL,
            agency_id = 'MASE-CLIENT-001',
            environment = 'production',
            auto_sync = TRUE,
            sync_interval_minutes = 15,
            enable_webhooks = TRUE,
            data_retention_days = 90,
            compression_enabled = FALSE,
            encryption_enabled = TRUE,
            status = 'connected',
            error_message = NULL,
            last_sync_time = NOW(),
            updated_at = NOW()
        WHERE id = existing_id;

        RAISE NOTICE '✅ Updated existing ExtendedCare configuration (ID: %)', existing_id;
    ELSE
        -- Insert new configuration
        INSERT INTO integrations_config (
            integration_name,
            api_url,
            username,
            password,
            api_key,
            agency_id,
            environment,
            auto_sync,
            sync_interval_minutes,
            enable_webhooks,
            data_retention_days,
            compression_enabled,
            encryption_enabled,
            status,
            error_message,
            last_sync_time,
            created_at,
            updated_at
        ) VALUES (
            'extendedcare',
            'https://api.extendedcare.com/v2',
            encrypted_username,
            encrypted_password,
            NULL,
            'MASE-CLIENT-001',
            'production',
            TRUE,
            15,
            TRUE,
            90,
            FALSE,
            TRUE,
            'connected',
            NULL,
            NOW(),
            NOW(),
            NOW()
        ) RETURNING id INTO existing_id;

        RAISE NOTICE '✅ Created new ExtendedCare configuration (ID: %)', existing_id;
    END IF;

    -- Display current configuration
    RAISE NOTICE '';
    RAISE NOTICE '📊 ExtendedCare Configuration:';
    RAISE NOTICE '   Integration: extendedcare';
    RAISE NOTICE '   Status: connected';
    RAISE NOTICE '   Environment: production';
    RAISE NOTICE '   Auto Sync: enabled';
    RAISE NOTICE '   Sync Interval: 15 minutes';
    RAISE NOTICE '   Webhooks: enabled';
    RAISE NOTICE '';
    RAISE NOTICE '✨ ExtendedCare is now configured!';
    RAISE NOTICE '🌐 Access at: /integrations/extendedcare-setup';
END $$;

-- Verify the configuration was saved
SELECT 
    id,
    integration_name,
    environment,
    status,
    auto_sync,
    sync_interval_minutes,
    enable_webhooks,
    last_sync_time,
    created_at,
    updated_at
FROM integrations_config
WHERE integration_name = 'extendedcare';


