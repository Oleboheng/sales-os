import { ScoringService } from '../scoring/service.js';
import { ResearchService } from '../prospecting/researchService.js';

export class ProfileService {
    constructor(db, researchService = new ResearchService(db)) {
        this.db = db;
        this.scoring = new ScoringService(db);
        this.researchService = researchService;
    }

    async getProfile(opportunityId, userId) {
        // 1. Opportunity + Organisation
        const oppRes = await this.db.query(
            `SELECT o.*, org.id as org_id, org.name as org_name, org.industry, org.sub_industry,
                    org.city, org.province, org.website, org.instagram, org.facebook,
                    org.phone, org.email, org.description, org.notes
             FROM opportunities o
             JOIN organisations org ON o.organisation_id = org.id
             WHERE o.id = $1 AND o.deleted_at IS NULL AND org.deleted_at IS NULL`,
            [opportunityId]
        );
        if (oppRes.rows.length === 0) {
            throw { status: 404, message: 'Opportunity not found' };
        }
        const opportunity = oppRes.rows[0];

        // 2. Research
        const researchContext = await this.researchService.getResearchContext(opportunityId);
        const research = researchContext.shared?.id
            ? {
                ...researchContext.shared,
                ...researchContext.typeSpecific,
                opportunity_id: opportunityId
            }
            : null;

        // 3. People (all contacts)
        const peopleRes = await this.db.query(
            `SELECT p.*, 
                    (p.id = o.decision_maker_person_id) as is_selected_dm
             FROM people p
             JOIN opportunities o ON o.organisation_id = p.organisation_id
             WHERE p.organisation_id = $1 AND o.id = $2
             ORDER BY p.is_decision_maker DESC, p.created_at ASC`,
            [opportunity.organisation_id, opportunityId]
        );
        const people = peopleRes.rows;

        // 4. Decision‑maker state (from opportunity)
        const dmState = {
            status: opportunity.decision_maker_status || 'NOT_IDENTIFIED',
            person_id: opportunity.decision_maker_person_id,
            notes: opportunity.decision_maker_notes,
        };
        // find the person if selected
        let selectedPerson = null;
        if (dmState.person_id) {
            const sp = people.find(p => p.id === dmState.person_id);
            if (sp) selectedPerson = sp;
        }

        // 5. Scoring
        let scoring = null;
        try {
            scoring = await this.scoring.getFullScoring(opportunityId);
        } catch (e) {
            // Scoring may be incomplete; we'll fall back to null
            scoring = null;
        }

        // 6. Recent activities (last 5)
        const activityRes = await this.db.query(
            `SELECT * FROM activities
             WHERE opportunity_id = $1
             ORDER BY completed_at DESC
             LIMIT 5`,
            [opportunityId]
        );
        const recentActivities = activityRes.rows;

        // 7. Pending tasks (only one next action)
        const taskRes = await this.db.query(
            `SELECT * FROM tasks
             WHERE opportunity_id = $1 AND status = 'pending'
             ORDER BY due_at ASC
             LIMIT 1`,
            [opportunityId]
        );
        const nextTask = taskRes.rows[0] || null;

        // 8. Recent notes (last 3)
        const noteRes = await this.db.query(
            `SELECT * FROM notes
             WHERE opportunity_id = $1
             ORDER BY created_at DESC
             LIMIT 3`,
            [opportunityId]
        );
        const recentNotes = noteRes.rows;

        // 9. Stage name
        const stageRes = await this.db.query(
            'SELECT name FROM pipeline_stages WHERE slug = $1',
            [opportunity.stage]
        );
        const stageName = stageRes.rows[0]?.name || opportunity.stage;

        return {
            opportunity: {
                id: opportunity.id,
                name: opportunity.name,
                stage: opportunity.stage,
                opportunity_type: opportunity.opportunity_type,
                stage_name: stageName,
                campaign: opportunity.campaign,
                source: opportunity.source,
                priority: opportunity.priority,
                fit_score: opportunity.fit_score,
                next_action: opportunity.next_action,
                next_action_due_at: opportunity.next_action_due_at,
                next_action_reason: opportunity.next_action_reason,
                sales_hypothesis: opportunity.sales_hypothesis,
                problem_identified: opportunity.problem_identified,
                current_process: opportunity.current_process,
                impact: opportunity.impact,
                qualification_notes: opportunity.qualification_notes,
                created_at: opportunity.created_at,
                updated_at: opportunity.updated_at,
            },
            organisation: {
                id: opportunity.org_id,
                name: opportunity.org_name,
                industry: opportunity.industry,
                sub_industry: opportunity.sub_industry,
                city: opportunity.city,
                province: opportunity.province,
                website: opportunity.website,
                instagram: opportunity.instagram,
                facebook: opportunity.facebook,
                phone: opportunity.phone,
                email: opportunity.email,
                description: opportunity.description,
                notes: opportunity.notes,
            },
            research,
            people,
            decisionMaker: {
                status: dmState.status,
                selectedPerson,
                notes: dmState.notes,
            },
            scoring,
            recentActivities,
            nextTask,
            recentNotes,
        };
    }
}
