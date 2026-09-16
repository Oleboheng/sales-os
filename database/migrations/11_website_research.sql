BEGIN;

CREATE TABLE IF NOT EXISTS website_research (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    research_id UUID NOT NULL UNIQUE
        REFERENCES research(id)
        ON DELETE CASCADE,

    website_status VARCHAR(30),

    website_url TEXT,

    digital_presence TEXT,

    problem_opportunity TEXT,

    potential_improvements TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT website_research_status_check
        CHECK (
            website_status IS NULL
            OR website_status IN (
                'NONE',
                'EXISTS',
                'OUTDATED',
                'BROKEN',
                'UNKNOWN'
            )
        )
);

DROP TRIGGER IF EXISTS update_website_research_updated_at
    ON website_research;

CREATE TRIGGER update_website_research_updated_at
    BEFORE UPDATE ON website_research
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
