-- =============================================
-- Phase 1 Pipeline & Governance Extensions
-- =============================================

-- 1. Pipeline Stages Definition
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    display_order INT NOT NULL,
    description TEXT,
    is_start BOOLEAN DEFAULT FALSE,
    is_terminal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO pipeline_stages (name, slug, display_order, description, is_start, is_terminal) VALUES
    ('Targeting', 'TARGETING', 0, 'Initial prospect captured', TRUE, FALSE),
    ('Researched', 'RESEARCHED', 10, 'Research completed', FALSE, FALSE),
    ('Permission Requested', 'PERMISSION_REQUESTED', 20, 'Permission requested', FALSE, FALSE),
    ('Permission Received', 'PERMISSION_RECEIVED', 30, 'Permission granted', FALSE, FALSE),
    ('Discovery', 'DISCOVERY', 40, 'Discovery call completed', FALSE, FALSE),
    ('Demonstration', 'DEMONSTRATION', 50, 'Demo completed', FALSE, FALSE),
    ('Proposal', 'PROPOSAL', 60, 'Proposal sent', FALSE, FALSE),
    ('Decision', 'DECISION', 70, 'Awaiting decision', FALSE, FALSE),
    ('Won', 'WON', 80, 'Closed won', FALSE, TRUE),
    ('Lost', 'LOST', 90, 'Closed lost', FALSE, TRUE),
    ('Nurture', 'NURTURE', 100, 'Future opportunity', FALSE, FALSE)
ON CONFLICT (slug) DO NOTHING;

-- 2. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add Ownership Fields to Tasks/Notes if missing
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
