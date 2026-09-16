-- Action Intelligence foundation (additive — no CRM table changes)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Signal definitions
CREATE TABLE IF NOT EXISTS intelligence_signal_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    value_type VARCHAR(30) NOT NULL,
    default_confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0000,
    decay_policy VARCHAR(30) NOT NULL DEFAULT 'NONE',
    default_ttl_seconds BIGINT,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    definition_version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT signal_definition_confidence_chk CHECK (default_confidence >= 0 AND default_confidence <= 1),
    CONSTRAINT signal_definition_value_type_chk CHECK (value_type IN ('BOOLEAN', 'TEXT', 'NUMERIC', 'JSON')),
    CONSTRAINT signal_definition_decay_chk CHECK (decay_policy IN ('NONE', 'FIXED_TTL', 'TIME_DECAY', 'EVENT_INVALIDATED')),
    CONSTRAINT signal_definition_severity_chk CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT signal_definition_version_chk CHECK (definition_version > 0),
    CONSTRAINT signal_definition_ttl_chk CHECK (default_ttl_seconds IS NULL OR default_ttl_seconds > 0)
);

-- 2. Signals
CREATE TABLE IF NOT EXISTS intelligence_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    definition_id UUID NOT NULL REFERENCES intelligence_signal_definitions(id),
    subject_type VARCHAR(30) NOT NULL,
    subject_id UUID,
    object_type VARCHAR(30),
    object_id UUID,
    value_type VARCHAR(30) NOT NULL,
    value_text TEXT,
    value_numeric NUMERIC,
    value_boolean BOOLEAN,
    value_json JSONB,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID,
    source_version VARCHAR(100),
    confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0000,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    supersedes_id UUID REFERENCES intelligence_signals(id),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT intelligence_signal_confidence_chk CHECK (confidence >= 0 AND confidence <= 1),
    CONSTRAINT intelligence_signal_value_type_chk CHECK (value_type IN ('BOOLEAN', 'TEXT', 'NUMERIC', 'JSON')),
    CONSTRAINT intelligence_signal_subject_type_chk CHECK (subject_type IN ('OPPORTUNITY', 'ORGANISATION', 'PERSON', 'RESEARCH', 'ACTIVITY', 'TASK')),
    CONSTRAINT intelligence_signal_status_chk CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'INVALIDATED', 'EXPIRED')),
    CONSTRAINT intelligence_signal_dates_chk CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

-- 3. Assessments
CREATE TABLE IF NOT EXISTS intelligence_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    assessment_type VARCHAR(100) NOT NULL,
    subject_type VARCHAR(30) NOT NULL,
    subject_id UUID,
    value_type VARCHAR(30) NOT NULL,
    value_text TEXT,
    value_numeric NUMERIC,
    value_json JSONB,
    confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0000,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    engine_run_id UUID,
    assessment_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT assessment_confidence_chk CHECK (confidence >= 0 AND confidence <= 1),
    CONSTRAINT assessment_value_type_chk CHECK (value_type IN ('BOOLEAN', 'TEXT', 'NUMERIC', 'JSON')),
    CONSTRAINT assessment_status_chk CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'INVALIDATED', 'EXPIRED')),
    CONSTRAINT assessment_subject_type_chk CHECK (subject_type IN ('OPPORTUNITY', 'ORGANISATION', 'PERSON', 'CHANNEL')),
    CONSTRAINT assessment_version_chk CHECK (assessment_version > 0),
    CONSTRAINT assessment_dates_chk CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

-- 4. Runs
CREATE TABLE IF NOT EXISTS intelligence_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    run_type VARCHAR(50) NOT NULL,
    engine_type VARCHAR(50) NOT NULL,
    engine_version VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_source_id UUID,
    input_hash VARCHAR(128),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'RUNNING',
    input_snapshot JSONB,
    output_summary JSONB,
    error_code VARCHAR(100),
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT intelligence_run_status_chk CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    CONSTRAINT intelligence_run_engine_chk CHECK (engine_type IN ('RULE_ENGINE', 'ML_MODEL', 'LOCAL_LLM', 'HYBRID', 'MANUAL'))
);

-- 5. Recommendations (organisation targets REQUIRE target_id)
CREATE TABLE IF NOT EXISTS intelligence_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES intelligence_runs(id),
    action_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    priority_score NUMERIC(10,4) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id UUID NOT NULL,
    target_label VARCHAR(255),
    channel VARCHAR(30),
    reason TEXT NOT NULL,
    confidence NUMERIC(5,4) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    rank INTEGER NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    supersedes_id UUID REFERENCES intelligence_recommendations(id),
    user_override BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT recommendation_priority_chk CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW', 'NONE')),
    CONSTRAINT recommendation_confidence_chk CHECK (confidence >= 0 AND confidence <= 1),
    CONSTRAINT recommendation_status_chk CHECK (status IN ('ACTIVE', 'EXECUTED', 'DISMISSED', 'EXPIRED', 'SUPERSEDED')),
    CONSTRAINT recommendation_rank_chk CHECK (rank > 0),
    CONSTRAINT recommendation_target_type_chk CHECK (target_type IN ('PERSON', 'ORGANISATION', 'OPPORTUNITY')),
    CONSTRAINT recommendation_dates_chk CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

-- 6. Evidence
CREATE TABLE IF NOT EXISTS intelligence_recommendation_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES intelligence_recommendations(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL,
    signal_id UUID REFERENCES intelligence_signals(id) ON DELETE SET NULL,
    assessment_id UUID REFERENCES intelligence_assessments(id) ON DELETE SET NULL,
    source_type VARCHAR(50),
    source_id UUID,
    weight NUMERIC(10,4) NOT NULL DEFAULT 1.0000,
    polarity VARCHAR(20) NOT NULL DEFAULT 'SUPPORTS',
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT evidence_polarity_chk CHECK (polarity IN ('SUPPORTS', 'CONTRADICTS', 'CONTEXT')),
    CONSTRAINT evidence_weight_chk CHECK (weight >= -1 AND weight <= 1)
);

-- 7. Feedback (recommended_target_type is VARCHAR)
CREATE TABLE IF NOT EXISTS intelligence_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    recommendation_id UUID REFERENCES intelligence_recommendations(id) ON DELETE SET NULL,
    run_id UUID REFERENCES intelligence_runs(id) ON DELETE SET NULL,
    feedback_type VARCHAR(50) NOT NULL,
    recommended_action VARCHAR(50),
    actual_action VARCHAR(50),
    recommended_target_type VARCHAR(30),
    recommended_target_id UUID,
    actual_target_type VARCHAR(30),
    actual_target_id UUID,
    outcome VARCHAR(100),
    reason TEXT,
    value_numeric NUMERIC,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_signals_opportunity ON intelligence_signals(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_signals_definition ON intelligence_signals(definition_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_signals_active ON intelligence_signals(opportunity_id, status, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_signals_subject ON intelligence_signals(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_assessments_opportunity ON intelligence_assessments(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_assessments_active ON intelligence_assessments(opportunity_id, status, valid_from DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_runs_opportunity ON intelligence_runs(opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_recommendations_opportunity ON intelligence_recommendations(opportunity_id, status, rank);
CREATE INDEX IF NOT EXISTS idx_intelligence_recommendations_active ON intelligence_recommendations(opportunity_id, status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_recommendation_evidence ON intelligence_recommendation_evidence(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_feedback_opportunity ON intelligence_feedback(opportunity_id, created_at DESC);
