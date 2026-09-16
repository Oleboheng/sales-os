-- Add last_login_at (needed for auth)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Add unique constraint on research (Phase 2 prep)
ALTER TABLE research ADD CONSTRAINT IF NOT EXISTS research_opportunity_id_key UNIQUE (opportunity_id);
