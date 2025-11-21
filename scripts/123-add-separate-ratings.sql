    -- =====================================================
    -- ADD SEPARATE RATING COLUMNS FOR DOCTOR AND NURSE
    -- =====================================================
    -- This allows both doctor and nurse to rate consultations

    -- Add separate rating columns
    ALTER TABLE telehealth_consultations
    ADD COLUMN IF NOT EXISTS doctor_rating INTEGER CHECK (doctor_rating >= 1 AND doctor_rating <= 5),
    ADD COLUMN IF NOT EXISTS nurse_rating INTEGER CHECK (nurse_rating >= 1 AND nurse_rating <= 5),
    ADD COLUMN IF NOT EXISTS doctor_feedback TEXT,
    ADD COLUMN IF NOT EXISTS nurse_feedback TEXT;

    -- Migrate existing ratings to doctor_rating
    -- (Assuming existing ratings were from doctors)
    UPDATE telehealth_consultations
    SET doctor_rating = rating
    WHERE rating IS NOT NULL AND doctor_rating IS NULL;

    -- Add indexes for performance
    CREATE INDEX IF NOT EXISTS idx_telehealth_consultations_doctor_rating
    ON telehealth_consultations(doctor_rating);

    CREATE INDEX IF NOT EXISTS idx_telehealth_consultations_nurse_rating
    ON telehealth_consultations(nurse_rating);

    -- Add comments
    COMMENT ON COLUMN telehealth_consultations.doctor_rating IS 'Doctor rates the overall consultation (1-5 stars)';
    COMMENT ON COLUMN telehealth_consultations.nurse_rating IS 'Nurse rates the doctor helpfulness (1-5 stars)';
    COMMENT ON COLUMN telehealth_consultations.doctor_feedback IS 'Doctor feedback about the consultation';
    COMMENT ON COLUMN telehealth_consultations.nurse_feedback IS 'Nurse feedback about the doctor';

    -- Success message
    DO $$
    BEGIN
    RAISE NOTICE '✅ Separate rating columns added successfully!';
    END $$;

