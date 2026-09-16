import { ScoringService } from '../scoring/service.js';
import { ResearchService } from '../prospecting/researchService.js';

export class QueueService {
    constructor(db, researchService = new ResearchService(db)) {
        this.db = db;
        this.scoring = new ScoringService(db);
        this.researchService = researchService;
    }

    // Get queue items with filters
    async getQueue(userId, filter = 'all') {
        // Build query to fetch all needed fields in one go
        const query = `
            WITH
            -- Latest pending task per opportunity
            latest_task AS (
                SELECT DISTINCT ON (opportunity_id)
                    opportunity_id,
                    title,
                    due_at,
                    priority
                FROM tasks
                WHERE status = 'pending'
                ORDER BY opportunity_id, due_at ASC
            ),
            -- Latest activity
            latest_activity AS (
                SELECT DISTINCT ON (opportunity_id)
                    opportunity_id,
                    completed_at
                FROM activities
                ORDER BY opportunity_id, completed_at DESC
            )
            SELECT
                o.id,
                o.name,
                o.opportunity_type,
                o.stage,
                o.fit_score,
                o.sales_hypothesis,
                o.next_action,
                o.next_action_due_at,
                o.priority as opp_priority,
                o.decision_maker_status,
                org.name as org_name,
                org.city,
                org.province,
                lt.title as task_title,
                lt.due_at as task_due_at,
                lt.priority as task_priority,
                la.completed_at as last_activity_at
            FROM opportunities o
            JOIN organisations org ON o.organisation_id = org.id
            LEFT JOIN latest_task lt ON o.id = lt.opportunity_id
            LEFT JOIN latest_activity la ON o.id = la.opportunity_id
            WHERE o.deleted_at IS NULL
              AND o.stage NOT IN ('WON', 'LOST')
              AND org.deleted_at IS NULL
            ORDER BY o.created_at DESC
        `;

        const res = await this.db.query(query);
        const researchContexts = await this.researchService.getResearchContexts(
            res.rows.map((row) => row.id)
        );
        const contextsByOpportunityId = new Map(
            researchContexts.map((context) => [context.opportunityId, context])
        );
        const items = [];

        for (const row of res.rows) {
            const research = this.getQueueResearchData(contextsByOpportunityId.get(row.id));
            const queueRow = {
                ...row,
                ...research,
                sales_hypothesis: row.sales_hypothesis || research.sales_hypothesis
            };

            // Compute qualification status using same rules as Phase 2D
            const qualification = this.evaluateQualification(queueRow);
            
            // Compute priority and reason
            const { priority, reason, dueDate } = this.computePriority(queueRow);

            // Determine next action text
            let nextActionText = queueRow.next_action;
            if (!nextActionText && queueRow.task_title) {
                nextActionText = queueRow.task_title;
            }
            let dueAt = queueRow.next_action_due_at || queueRow.task_due_at;

            // Build item
            const item = {
                id: queueRow.id,
                name: queueRow.name,
                org_name: queueRow.org_name,
                city: queueRow.city,
                province: queueRow.province,
                stage: queueRow.stage,
                fit_score: queueRow.fit_score,
                sales_hypothesis: queueRow.sales_hypothesis,
                decision_maker_status: queueRow.decision_maker_status || 'NOT_IDENTIFIED',
                opportunity_type: queueRow.opportunity_type,
                research_completed: queueRow.research_completed_at !== null,
                next_action: nextActionText,
                due_at: dueAt,
                last_activity_at: row.last_activity_at,
                qualification: qualification,
                priority: priority,
                priority_reason: reason,
                // For UI
                score_band: this.getBand(row.fit_score)
            };
            items.push(item);
        }

        // Apply filter
        let filtered = items;
        if (filter === 'overdue') {
            const now = new Date();
            filtered = items.filter(item => {
                if (!item.due_at) return false;
                const due = new Date(item.due_at);
                return due < now;
            });
        } else if (filter === 'today') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            filtered = items.filter(item => {
                if (!item.due_at) return false;
                const due = new Date(item.due_at);
                return due >= today && due < tomorrow;
            });
        } else if (filter === 'research') {
            filtered = items.filter(item => !item.research_completed);
        } else if (filter === 'follow-up') {
            // Follow-up filter: items with next_action or task, and in stages like DISCOVERY, DEMO, PROPOSAL, etc.
            const followStages = ['DISCOVERY', 'DEMONSTRATION', 'PROPOSAL', 'DECISION'];
            filtered = items.filter(item => 
                (item.next_action || item.task_title) && 
                followStages.includes(item.stage)
            );
        } // 'all' – no additional filter

        // Sort by priority (high to low)
        // priority values: 'overdue', 'due-today', 'active-followup', 'qualified-ready', 'research-needed', 'low'
        const priorityOrder = {
            'overdue': 0,
            'due-today': 1,
            'active-followup': 2,
            'qualified-ready': 3,
            'research-needed': 4,
            'low': 5
        };
        filtered.sort((a, b) => {
            const pa = priorityOrder[a.priority] ?? 5;
            const pb = priorityOrder[b.priority] ?? 5;
            if (pa !== pb) return pa - pb;
            // secondary by due date (earlier first)
            if (a.due_at && b.due_at) return new Date(a.due_at) - new Date(b.due_at);
            if (a.due_at) return -1;
            if (b.due_at) return 1;
            // tertiary by score
            return (b.fit_score || 0) - (a.fit_score || 0);
        });

        return filtered;
    }

    getQueueResearchData(researchContext) {
        const shared = researchContext?.shared || {};
        const typeSpecific = researchContext?.typeSpecific || {};
        const isSports = researchContext?.opportunityType === 'SPORTS_MANAGEMENT';

        return {
            research_completed_at: shared.completed_at ?? null,
            website_reviewed: shared.website_reviewed ?? false,
            social_reviewed: shared.social_reviewed ?? false,
            admin_complexity: isSports
                ? typeSpecific.admin_complexity ?? shared.admin_complexity
                : undefined,
            current_system: isSports
                ? typeSpecific.current_system ?? shared.current_system
                : undefined,
            registration_method: isSports
                ? typeSpecific.registration_method ?? shared.registration_method
                : undefined,
            website_status: !isSports ? typeSpecific.website_status ?? null : undefined,
            website_url: !isSports ? typeSpecific.website_url ?? null : undefined,
            digital_presence: !isSports ? typeSpecific.digital_presence ?? null : undefined,
            problem_opportunity: !isSports ? typeSpecific.problem_opportunity ?? null : undefined,
            potential_improvements: !isSports ? typeSpecific.potential_improvements ?? null : undefined,
            sales_hypothesis: shared.sales_hypothesis
        };
    }

    // Qualification evaluation – same as Phase 2D
    evaluateQualification(row) {
        if (row.opportunity_type === 'WEBSITE') {
            const researchCompleted = row.research_completed_at !== null;
            const websiteStatus = Boolean(row.website_status);
            const websiteUrlRequired = !['NONE', 'UNKNOWN'].includes(row.website_status);
            const websiteUrlValid = !websiteUrlRequired || Boolean(row.website_url);
            const digitalPresence = Boolean(row.digital_presence?.trim()?.length >= 3);
            const problemOpportunity = Boolean(row.problem_opportunity?.trim()?.length >= 3);
            const potentialImprovements = Boolean(row.potential_improvements?.trim()?.length >= 3);
            const hasHypothesis = Boolean(row.sales_hypothesis?.trim()?.length >= 3);
            const dmStatus = (row.decision_maker_status || '').toUpperCase();
            const dmKnown = dmStatus === 'IDENTIFIED' || dmStatus === 'NOT_IDENTIFIED';

            const gates = {
                researchCompleted,
                websiteStatus,
                websiteUrlValid,
                digitalPresence,
                problemOpportunity,
                potentialImprovements,
                hasHypothesis,
                dmKnown
            };
            const missing = [];
            if (!researchCompleted) missing.push('Research not completed');
            if (!websiteStatus) missing.push('Website status missing');
            if (!websiteUrlValid) missing.push('Website URL missing');
            if (!digitalPresence) missing.push('Digital presence summary missing');
            if (!problemOpportunity) missing.push('Commercial/problem opportunity missing');
            if (!potentialImprovements) missing.push('Potential improvements missing');
            if (!hasHypothesis) missing.push('Sales hypothesis missing');
            if (!dmKnown) missing.push('Decision-maker situation uncertain');

            return {
                status: Object.values(gates).every(Boolean) ? 'QUALIFIED' : 'NOT_READY',
                gates,
                missing
            };
        }

        const researchCompleted = row.research_completed_at !== null;
        const fitEstablished = (row.fit_score || 0) > 0;
        const hasProblem = Boolean(
            row.admin_complexity || row.current_system || row.registration_method
        );
        const hasHypothesis = row.sales_hypothesis && row.sales_hypothesis.trim().length >= 3;
        const dmStatus = (row.decision_maker_status || '').toUpperCase();
        const dmKnown = dmStatus === 'IDENTIFIED' || dmStatus === 'NOT_IDENTIFIED';

        const gates = { researchCompleted, fitEstablished, hasProblem, hasHypothesis, dmKnown };
        const allPassed = Object.values(gates).every(v => v === true);
        const missing = [];
        if (!researchCompleted) missing.push('Research not completed');
        if (!fitEstablished) missing.push('Organisation fit not established');
        if (!hasProblem) missing.push('Operational problem not identified');
        if (!hasHypothesis) missing.push('Sales hypothesis missing');
        if (!dmKnown) missing.push('Decision-maker situation uncertain');

        return {
            status: allPassed ? 'QUALIFIED' : 'NOT_READY',
            gates,
            missing
        };
    }

    // Priority computation
    computePriority(row) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let due = row.next_action_due_at || row.task_due_at;
        let reason = '';
        let priority = 'low';

        if (due) {
            const dueDate = new Date(due);
            if (dueDate < now) {
                priority = 'overdue';
                reason = 'Overdue action';
                return { priority, reason, dueDate };
            } else if (dueDate >= today && dueDate < tomorrow) {
                priority = 'due-today';
                reason = 'Action due today';
                return { priority, reason, dueDate };
            }
        }

        // Check if active sales stage
        const activeStages = ['DISCOVERY', 'DEMONSTRATION', 'PROPOSAL', 'DECISION'];
        if (activeStages.includes(row.stage) && (row.next_action || row.task_title)) {
            priority = 'active-followup';
            reason = 'Active sales follow-up needed';
            return { priority, reason, dueDate: due || null };
        }

        // Check qualified
        const qual = this.evaluateQualification(row);
        if (qual.status === 'QUALIFIED') {
            priority = 'qualified-ready';
            reason = 'Qualified and ready for outreach';
            return { priority, reason, dueDate: due || null };
        }

        // Research needed
        if (!row.research_completed_at) {
            priority = 'research-needed';
            reason = 'Research required';
            return { priority, reason, dueDate: null };
        }

        // Low priority
        priority = 'low';
        reason = 'No immediate action';
        return { priority, reason, dueDate: null };
    }

    getBand(score) {
        if (score >= 90) return 'VERY_HIGH';
        if (score >= 75) return 'HIGH';
        if (score >= 60) return 'GOOD';
        if (score >= 40) return 'MODERATE';
        return 'LOW';
    }
}
