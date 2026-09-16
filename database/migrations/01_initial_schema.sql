-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organisations
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    province VARCHAR(50),
    city VARCHAR(100),
    website TEXT,
    instagram VARCHAR(100),
    facebook VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    industry VARCHAR(50) DEFAULT 'football-academy',
    sub_industry VARCHAR(100),
    description TEXT,
    notes TEXT,
    research_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- People (Contacts)
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    title VARCHAR(100),
    email VARCHAR(255),
    personal_email VARCHAR(255),
    phone_primary VARCHAR(50),
    phone_whatsapp VARCHAR(50),
    linkedin VARCHAR(255),
    is_decision_maker BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opportunities (Sales pipeline)
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'TARGETING',
    campaign VARCHAR(100),
    source VARCHAR(50),
    fit_score INT DEFAULT 0,
    priority VARCHAR(20),
    reason_priority TEXT,
    trigger TEXT,
    sales_hypothesis TEXT,
    problem_identified TEXT,
    current_process TEXT,
    impact TEXT,
    authority BOOLEAN,
    timing VARCHAR(50),
    budget VARCHAR(50),
    qualification_notes TEXT,
    qualified_at TIMESTAMP,
    demo_completed_at TIMESTAMP,
    proposal_sent_at TIMESTAMP,
    proposal_value DECIMAL(10,2),
    won_at TIMESTAMP,
    lost_at TIMESTAMP,
    lost_reason VARCHAR(50),
    lost_notes TEXT,
    next_action TEXT,
    next_action_due_at TIMESTAMP,
    next_action_reason TEXT,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    direction VARCHAR(10) DEFAULT 'outbound',
    subject VARCHAR(255),
    content TEXT,
    duration_minutes INT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    outcome TEXT,
    next_action TEXT,
    next_action_due TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_at TIMESTAMP NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Research
CREATE TABLE research (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    website_reviewed BOOLEAN DEFAULT FALSE,
    website_quality VARCHAR(20),
    social_reviewed BOOLEAN DEFAULT FALSE,
    teams_count INT,
    players_estimate INT,
    admin_complexity VARCHAR(20),
    decision_maker_identified BOOLEAN DEFAULT FALSE,
    decision_maker_name VARCHAR(255),
    current_system TEXT,
    communication_method TEXT,
    registration_method TEXT,
    reporting_method TEXT,
    sales_hypothesis TEXT,
    notes TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (for later multi‑user)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'sales',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automatic updated_at triggers (optional but recommended)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organisations_updated_at BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_updated_at BEFORE UPDATE ON research FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
