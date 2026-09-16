-- =============================================
-- Phase 1 Extensions (run after 01_initial_schema)
-- =============================================

-- 1. Pipeline Stages (pre‑defined)
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    display_order INT NOT NULL,
    description TEXT,
    is_start BOOLEAN DEFAULT FALSE,
    is_terminal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed stages (as defined in the plan)
INSERT INTO pipeline_stages (name, slug, display_order, description, is_start, is_terminal) VALUES
    ('TARGETING', 'targeting', 0, 'Initial prospect captured', TRUE, FALSE),
    ('RESEARCHED', 'researched', 10, 'Research completed', FALSE, FALSE),
    ('PERMISSION_REQUESTED', 'permission_requested', 20, 'Permission requested', FALSE, FALSE),
    ('PERMISSION_RECEIVED', 'permission_received', 30, 'Permission granted', FALSE, FALSE),
    ('DISCOVERY', 'discovery', 40, 'Discovery call completed', FALSE, FALSE),
    ('DEMONSTRATION', 'demonstration', 50, 'Demo completed', FALSE, FALSE),
    ('PROPOSAL', 'proposal', 60, 'Proposal sent', FALSE, FALSE),
    ('DECISION', 'decision', 70, 'Awaiting decision', FALSE, FALSE),
    ('WON', 'won', 80, 'Closed won', FALSE, TRUE),
    ('LOST', 'lost', 90, 'Closed lost', FALSE, TRUE),
    ('NURTURE', 'nurture', 100, 'Future opportunity', FALSE, FALSE);

-- 2. Add user_id to activities, tasks, notes (for ownership)
ALTER TABLE activities ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 3. Create notes table (if missing)
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES people(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Audit logs
CREATE TABLE audit_logs (
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

-- 5. Soft delete columns (optional)
ALTER TABLE organisations ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE opportunities ADD COLUMN deleted_at TIMESTAMP;

-- 6. Indexes for performance
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_org ON opportunities(organisation_id);
CREATE INDEX idx_activities_opportunity ON activities(opportunity_id);
CREATE INDEX idx_tasks_opportunity ON tasks(opportunity_id);
CREATE INDEX idx_tasks_due_at ON tasks(due_at) WHERE status = 'pending';
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
