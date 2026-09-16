-- Expand the approved opportunity type values.

BEGIN;

ALTER TABLE opportunities
DROP CONSTRAINT IF EXISTS opportunities_opportunity_type_check;

ALTER TABLE opportunities
ADD CONSTRAINT opportunities_opportunity_type_check
CHECK (
    opportunity_type IN (
        'SPORTS_MANAGEMENT',
        'WEBSITE',
        'BOOKING_SYSTEM'
    )
);

COMMIT;
