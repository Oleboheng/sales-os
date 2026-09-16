-- Type-Aware Research Boundary
-- Phase 2: Migrate existing Sports Management research data
--
-- Legacy columns in research remain untouched during this transition.
-- This migration copies Sports-specific facts into the typed extension.

BEGIN;

INSERT INTO sports_management_research (
    research_id,
    teams_count,
    players_estimate,
    admin_complexity,
    current_system,
    communication_method,
    registration_method,
    reporting_method
)
SELECT
    r.id,
    r.teams_count,
    r.players_estimate,
    r.admin_complexity,
    r.current_system,
    r.communication_method,
    r.registration_method,
    r.reporting_method
FROM research r
JOIN opportunities o
    ON o.id = r.opportunity_id
WHERE o.opportunity_type = 'SPORTS_MANAGEMENT'
ON CONFLICT (research_id) DO NOTHING;

COMMIT;
