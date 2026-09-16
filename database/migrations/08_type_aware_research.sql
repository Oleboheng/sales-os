-- Type-Aware Research Boundary
-- Phase 1: Sports Management research extension
--
-- Shared research remains the opportunity-level research lifecycle.
-- Sports-specific facts move into this 1:1 extension.

BEGIN;

CREATE TABLE IF NOT EXISTS sports_management_research (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    research_id UUID NOT NULL UNIQUE
        REFERENCES research(id)
        ON DELETE CASCADE,

    teams_count INTEGER,
    players_estimate INTEGER,
    admin_complexity VARCHAR(20),

    current_system TEXT,
    communication_method TEXT,
    registration_method TEXT,
    reporting_method TEXT,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sports_management_research_research_id_idx
    ON sports_management_research(research_id);

CREATE TRIGGER update_sports_management_research_updated_at
BEFORE UPDATE ON sports_management_research
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE sports_management_research IS
'Sports Management-specific research data. One extension record per shared research record.';

COMMENT ON COLUMN sports_management_research.research_id IS
'Parent shared research record. One-to-one relationship.';

COMMIT;
