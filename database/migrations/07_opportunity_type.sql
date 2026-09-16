-- Opportunity Type Foundation
-- Initial supported type: SPORTS_MANAGEMENT

BEGIN;

-- 1. Add the authoritative opportunity type column.
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS opportunity_type VARCHAR(50);

-- 2. Backfill all existing opportunities.
UPDATE opportunities
SET opportunity_type = 'SPORTS_MANAGEMENT'
WHERE opportunity_type IS NULL;

-- 3. Make the field mandatory after backfill.
ALTER TABLE opportunities
ALTER COLUMN opportunity_type SET NOT NULL;

-- 4. Enforce the currently supported opportunity type.
ALTER TABLE opportunities
DROP CONSTRAINT IF EXISTS opportunities_opportunity_type_check;

ALTER TABLE opportunities
ADD CONSTRAINT opportunities_opportunity_type_check
CHECK (opportunity_type IN ('SPORTS_MANAGEMENT'));

-- 5. Default future database inserts to the current supported type.
ALTER TABLE opportunities
ALTER COLUMN opportunity_type SET DEFAULT 'SPORTS_MANAGEMENT';

COMMENT ON COLUMN opportunities.opportunity_type IS
'Authoritative opportunity type. Current supported value: SPORTS_MANAGEMENT.';

COMMIT;
