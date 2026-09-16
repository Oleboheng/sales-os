-- Phase 2C: Decision-Maker Intelligence

-- Add intelligence fields to people
ALTER TABLE people
ADD COLUMN IF NOT EXISTS authority_level VARCHAR(20) DEFAULT 'UNKNOWN',
ADD COLUMN IF NOT EXISTS confidence_level VARCHAR(20) DEFAULT 'UNKNOWN',
ADD COLUMN IF NOT EXISTS preferred_channel VARCHAR(20) DEFAULT 'UNKNOWN',
ADD COLUMN IF NOT EXISTS intelligence_evidence TEXT;

-- Add decision-maker fields to opportunities
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS decision_maker_status VARCHAR(20) DEFAULT 'NOT_IDENTIFIED',
ADD COLUMN IF NOT EXISTS decision_maker_person_id UUID,
ADD COLUMN IF NOT EXISTS decision_maker_notes TEXT;

-- Foreign key constraint (safe, only if column exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_decision_maker_person_id_fkey'
    ) THEN
        ALTER TABLE opportunities
        ADD CONSTRAINT opportunities_decision_maker_person_id_fkey
        FOREIGN KEY (decision_maker_person_id) REFERENCES people(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_people_organisation ON people(organisation_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_dm_status ON opportunities(decision_maker_status);
CREATE INDEX IF NOT EXISTS idx_opportunities_dm_person ON opportunities(decision_maker_person_id);

-- Comments for clarity
COMMENT ON COLUMN people.authority_level IS 'HIGH, MEDIUM, LOW, UNKNOWN';
COMMENT ON COLUMN people.confidence_level IS 'HIGH, MEDIUM, LOW, UNKNOWN';
COMMENT ON COLUMN people.preferred_channel IS 'WHATSAPP, PHONE, EMAIL, LINKEDIN, UNKNOWN';
COMMENT ON COLUMN opportunities.decision_maker_status IS 'IDENTIFIED, UNCERTAIN, NOT_IDENTIFIED';
