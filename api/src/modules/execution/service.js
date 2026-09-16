import { ScoringService } from '../scoring/service.js';
import { ResearchService } from '../prospecting/researchService.js';

const ACTION_OUTCOMES = {
    CALL: ['Connected', 'No answer', 'Busy', 'Wrong number', 'Not interested', 'Interested'],
    WHATSAPP: ['Sent', 'Replied', 'Interested', 'No response'],
    LINKEDIN: ['Connection sent', 'Message sent', 'Replied', 'No response'],
    EMAIL: ['Sent', 'Replied', 'No response'],
    RESEARCH: ['Research completed', 'Need more information'],
    NOTE: ['Quick note'],
    DECISION_MAKER: ['Identified', 'Uncertain', 'Not identified'],
    FOLLOW_UP: ['Completed', 'Rescheduled', 'No response', 'Interested', 'Not interested'],
    TASK: ['Completed', 'Rescheduled', 'Cancelled'],
    OUTREACH: ['Sent', 'Replied', 'No response', 'Interested', 'Not interested']
};

const VALID_NEXT_ACTIONS = [
    'Follow up', 'Call', 'WhatsApp', 'Email', 'LinkedIn',
    'Research', 'Schedule meeting', 'Send proposal', 'Other'
];

const VALID_NEXT_REASONS = [
    'Waiting for response', 'Requested follow-up', 'Need more information',
    'Proposal requested', 'Decision pending'
];

// Conservative outcome → suggestion map (only when the outcome clearly implies a next step)
function suggestFromOutcome(actionType, outcome) {
    const key = `${actionType}|${outcome}`;
    const map = {
        'CALL|No answer': { next_action: 'Follow up', due_days: 2, reason: 'Waiting for response' },
        'CALL|Busy': { next_action: 'Call', due_days: 1, reason: 'Requested follow-up' },
        'CALL|Wrong number': { next_action: 'Research', due_days: null, reason: 'Need more information' },
        'CALL|Interested': { next_action: 'Schedule meeting', due_days: null, reason: null },
        'CALL|Not interested': { next_action: null, due_days: null, reason: null, suggest_close_lost: true },
        // Connected intentionally has NO automatic suggestion
        'WHATSAPP|Sent': { next_action: 'Follow up', due_days: 3, reason: 'Waiting for response' },
        'WHATSAPP|No response': { next_action: 'Follow up', due_days: 2, reason: 'Waiting for response' },
        'WHATSAPP|Interested': { next_action: 'Schedule meeting', due_days: null, reason: null },
        // Replied intentionally has NO automatic suggestion
        'EMAIL|Sent': { next_action: 'Follow up', due_days: 3, reason: 'Waiting for response' },
        'EMAIL|No response': { next_action: 'Follow up', due_days: 2, reason: 'Waiting for response' },
        // Replied intentionally has NO automatic suggestion
        'LINKEDIN|Connection sent': { next_action: 'Follow up', due_days: 3, reason: 'Waiting for response' },
        'LINKEDIN|Message sent': { next_action: 'Follow up', due_days: 3, reason: 'Waiting for response' },
        'LINKEDIN|No response': { next_action: 'Follow up', due_days: 3, reason: 'Waiting for response' },
        'FOLLOW_UP|No response': { next_action: 'Follow up', due_days: 2, reason: 'Waiting for response' },
        'FOLLOW_UP|Interested': { next_action: 'Schedule meeting', due_days: null, reason: null },
        'FOLLOW_UP|Not interested': { next_action: null, due_days: null, reason: null, suggest_close_lost: true },
        'RESEARCH|Need more information': { next_action: 'Research', due_days: null, reason: 'Need more information' }
    };
    return map[key] || null;
}

function addBusinessDaysLocal(days) {
    if (days == null) return null;
    const d = new Date();
    let added = 0;
    while (added < days) {
        d.setDate(d.getDate() + 1);
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) added++;
    }
    d.setHours(9, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export class ExecutionService {
    constructor(db, researchService = new ResearchService(db)) {
        this.db = db;
        this.scoring = new ScoringService(db);
        this.researchService = researchService;
    }

    async getExecutionContext(opportunityId, userId) {
        const query = `
            SELECT
                o.id, o.name, o.stage, o.fit_score, o.sales_hypothesis,
                o.next_action, o.next_action_due_at, o.next_action_reason,
                o.decision_maker_status, o.decision_maker_person_id,
                org.id as org_id, org.name as org_name, org.city, org.province,
                org.phone, org.email, org.website, org.instagram, org.facebook,
                p.id as person_id, p.first_name, p.last_name, p.role,
                p.phone_primary, p.phone_whatsapp, p.email as person_email, p.linkedin,
                p.is_decision_maker, p.authority_level, p.confidence_level, p.preferred_channel,
                t.id as task_id, t.title as task_title, t.due_at as task_due_at, t.status as task_status
            FROM opportunities o
            JOIN organisations org ON o.organisation_id = org.id
            LEFT JOIN people p ON o.decision_maker_person_id = p.id
            LEFT JOIN tasks t ON o.id = t.opportunity_id AND t.status = 'pending' AND t.due_at = (
                SELECT MIN(due_at) FROM tasks WHERE opportunity_id = o.id AND status = 'pending'
            )
            WHERE o.id = $1 AND o.deleted_at IS NULL AND org.deleted_at IS NULL
        `;
        const res = await this.db.query(query, [opportunityId]);
        if (res.rows.length === 0) throw { status: 404, message: 'Opportunity not found' };
        const row = res.rows[0];
        const researchContext = await this.researchService.getResearchContext(opportunityId);
        const sharedResearch = researchContext.shared || {};
        const typeSpecificResearch = researchContext.typeSpecific || {};
        const isSports = researchContext.opportunityType === 'SPORTS_MANAGEMENT';
        const researchId = sharedResearch.id || null;
        const researchCompletedAt = sharedResearch.completed_at || null;

        row.research_id = researchId;
        row.research_completed_at = researchCompletedAt;
        row.website_reviewed = sharedResearch.website_reviewed ?? false;
        row.social_reviewed = sharedResearch.social_reviewed ?? false;
        row.admin_complexity = isSports
            ? typeSpecificResearch.admin_complexity ?? sharedResearch.admin_complexity ?? null
            : null;
        row.current_system = isSports
            ? typeSpecificResearch.current_system ?? sharedResearch.current_system ?? null
            : null;
        row.registration_method = isSports
            ? typeSpecificResearch.registration_method ?? sharedResearch.registration_method ?? null
            : null;
        row.research_hypothesis = sharedResearch.sales_hypothesis || null;

        // Research state
        let researchState = 'NOT_STARTED';
        if (row.research_id) {
            researchState = row.research_completed_at ? 'COMPLETED' : 'IN_PROGRESS';
        }

        // DM state
        const dmStatus = (row.decision_maker_status || '').toUpperCase();
        const dmKnown = dmStatus === 'IDENTIFIED' || dmStatus === 'NOT_IDENTIFIED';
        const dmIdentified = dmStatus === 'IDENTIFIED';

        const dmPerson = row.person_id ? {
            id: row.person_id,
            first_name: row.first_name,
            last_name: row.last_name,
            role: row.role,
            phone_primary: row.phone_primary,
            phone_whatsapp: row.phone_whatsapp,
            email: row.person_email,
            linkedin: row.linkedin,
            preferred_channel: (row.preferred_channel || 'UNKNOWN').toUpperCase(),
            authority_level: row.authority_level,
            confidence_level: row.confidence_level
        } : null;

        // Latest activity (structured fields only — not subject parsing for decisions)
        const actRes = await this.db.query(
            `SELECT type, outcome, subject, content, completed_at
             FROM activities
             WHERE opportunity_id = $1
             ORDER BY completed_at DESC NULLS LAST
             LIMIT 1`,
            [opportunityId]
        );
        const lastAct = actRes.rows[0] || null;
        let last_interaction = null;
        if (lastAct) {
            const daysAgo = lastAct.completed_at
                ? Math.floor((Date.now() - new Date(lastAct.completed_at).getTime()) / 86400000)
                : null;
            last_interaction = {
                type: lastAct.type,
                outcome: lastAct.outcome,
                subject: lastAct.subject,
                content: lastAct.content,
                completed_at: lastAct.completed_at,
                days_ago: daysAgo
            };
        }

        // Latest note (optional memory surface)
        const noteRes = await this.db.query(
            `SELECT body, created_at FROM notes
             WHERE opportunity_id = $1
             ORDER BY created_at DESC LIMIT 1`,
            [opportunityId]
        );
        const latest_note = noteRes.rows[0]
            ? { body: noteRes.rows[0].body, created_at: noteRes.rows[0].created_at }
            : null;

        // --- Target helpers (person only when DM identified) ---
        const targetFromDm = (channel) => {
            if (!dmPerson) return null;
            if (channel === 'CALL') return dmPerson.phone_primary || dmPerson.phone_whatsapp || null;
            if (channel === 'WHATSAPP') return dmPerson.phone_whatsapp || dmPerson.phone_primary || null;
            if (channel === 'EMAIL') return dmPerson.email || null;
            if (channel === 'LINKEDIN') return dmPerson.linkedin || null;
            return null;
        };

        const resolveChannel = (preferred) => {
            const pref = (preferred || 'UNKNOWN').toUpperCase();
            const tryOrder = [];
            if (pref === 'PHONE') tryOrder.push('CALL');
            else if (['WHATSAPP', 'EMAIL', 'LINKEDIN'].includes(pref)) tryOrder.push(pref);
            for (const ch of ['WHATSAPP', 'CALL', 'EMAIL', 'LINKEDIN']) {
                if (!tryOrder.includes(ch)) tryOrder.push(ch);
            }
            for (const ch of tryOrder) {
                if (targetFromDm(ch)) return ch;
            }
            return null;
        };

        // Wrong-number awareness: only suppress CALL if latest CALL outcome is Wrong number
        // AND the current phone destination still matches what we would dial now.
        // Changing the person's phone clears the suppression naturally.
        const currentCallTarget = targetFromDm('CALL');
        const suppressCall =
            lastAct &&
            lastAct.type === 'CALL' &&
            lastAct.outcome === 'Wrong number' &&
            currentCallTarget &&
            lastAct.subject &&
            lastAct.subject.includes(currentCallTarget.replace(/\s/g, '').slice(-6)); // soft match on last digits

        // --- Available actions ---
        let availableActions = [];

        if (dmIdentified && dmPerson) {
            const name = `${dmPerson.first_name || ''} ${dmPerson.last_name || ''}`.trim() || 'Contact';
            const callT = targetFromDm('CALL');
            const waT = targetFromDm('WHATSAPP');
            const emailT = targetFromDm('EMAIL');
            const liT = targetFromDm('LINKEDIN');
            if (callT && !suppressCall) {
                availableActions.push({
                    type: 'CALL', label: `Call ${name}`, target: callT,
                    target_type: 'person', target_name: name, person_id: dmPerson.id
                });
            }
            if (waT) {
                availableActions.push({
                    type: 'WHATSAPP', label: `WhatsApp ${name}`, target: waT,
                    target_type: 'person', target_name: name, person_id: dmPerson.id
                });
            }
            if (emailT) {
                availableActions.push({
                    type: 'EMAIL', label: `Email ${name}`, target: emailT,
                    target_type: 'person', target_name: name, person_id: dmPerson.id
                });
            }
            if (liT) {
                availableActions.push({
                    type: 'LINKEDIN', label: `LinkedIn ${name}`, target: liT,
                    target_type: 'person', target_name: name, person_id: dmPerson.id
                });
            }
        } else {
            // Organisation-level only — never an arbitrary person
            const orgName = row.org_name || 'Organisation';
            if (row.phone) {
                availableActions.push({
                    type: 'CALL', label: `Call ${orgName}`, target: row.phone,
                    target_type: 'organisation', target_name: orgName, person_id: null
                });
            }
            if (row.email) {
                availableActions.push({
                    type: 'EMAIL', label: `Email ${orgName}`, target: row.email,
                    target_type: 'organisation', target_name: orgName, person_id: null
                });
            }
        }

        // --- Recommendation (deterministic priority) ---
        let recommendedAction = null;
        let reason = null;
        let flags = { suggest_close_lost: false };

        const now = new Date();
        const overdueNext =
            row.next_action && row.next_action_due_at && new Date(row.next_action_due_at) <= now;
        const overdueTask =
            row.task_id && row.task_due_at && new Date(row.task_due_at) <= now;

        // 1. Terminal recent outcome
        if (lastAct && (lastAct.outcome === 'Not interested')) {
            flags.suggest_close_lost = true;
            reason = 'Last interaction was Not interested';
            recommendedAction = { type: 'NONE', label: 'Consider closing as Lost', reason };
        }
        // 2. Overdue follow-up / task
        else if (overdueNext) {
            recommendedAction = {
                type: 'FOLLOW_UP',
                label: row.next_action || 'Follow up',
                reason: 'Follow-up is overdue'
            };
            reason = recommendedAction.reason;
        } else if (overdueTask) {
            recommendedAction = {
                type: 'TASK',
                label: row.task_title || 'Complete Task',
                reason: 'Task is overdue'
            };
            reason = recommendedAction.reason;
        }
        // 3. Research groundwork
        else if (researchState === 'NOT_STARTED') {
            recommendedAction = { type: 'RESEARCH', label: 'Research', reason: 'Research not started' };
            reason = recommendedAction.reason;
            if (!availableActions.find(a => a.type === 'RESEARCH')) {
                availableActions.unshift({ type: 'RESEARCH', label: 'Research' });
            }
        } else if (researchState === 'IN_PROGRESS') {
            recommendedAction = { type: 'RESEARCH', label: 'Continue Research', reason: 'Research saved but incomplete' };
            reason = recommendedAction.reason;
            if (!availableActions.find(a => a.type === 'RESEARCH')) {
                availableActions.unshift({ type: 'RESEARCH', label: 'Continue Research' });
            }
        }
        // 4. DM identification
        else if (!dmIdentified) {
            recommendedAction = { type: 'DECISION_MAKER', label: 'Identify Decision Maker', reason: 'Research complete, decision maker not confirmed' };
            reason = recommendedAction.reason;
            if (!availableActions.find(a => a.type === 'DECISION_MAKER')) {
                availableActions.push({ type: 'DECISION_MAKER', label: 'Decision Maker' });
            }
        }
        // 5. Recent sent / no-response → follow up (structured outcome, not subject parsing)
        else if (
            lastAct &&
            ['Sent', 'No response', 'Connection sent', 'Message sent'].includes(lastAct.outcome) &&
            ['WHATSAPP', 'EMAIL', 'LINKEDIN', 'CALL', 'FOLLOW_UP', 'OUTREACH'].includes(lastAct.type)
        ) {
            const who = dmPerson ? (dmPerson.first_name || 'contact') : (row.org_name || 'prospect');
            recommendedAction = {
                type: 'FOLLOW_UP',
                label: `Follow up with ${who}`,
                reason: last_interaction.days_ago != null
                    ? `No response to ${lastAct.type} ${last_interaction.days_ago} day(s) ago`
                    : `No response to recent ${lastAct.type}`
            };
            reason = recommendedAction.reason;
        }
        // 6. DM identified → strongest channel
        else if (dmIdentified && dmPerson) {
            const channel = resolveChannel(dmPerson.preferred_channel);
            const name = `${dmPerson.first_name || ''} ${dmPerson.last_name || ''}`.trim() || 'Contact';
            if (channel === 'WHATSAPP' && targetFromDm('WHATSAPP')) {
                recommendedAction = {
                    type: 'WHATSAPP', label: `WhatsApp ${name}`, target: targetFromDm('WHATSAPP'),
                    target_type: 'person', target_name: name, person_id: dmPerson.id,
                    reason: dmPerson.preferred_channel === 'WHATSAPP'
                        ? 'Preferred channel is WhatsApp'
                        : 'Strongest available channel on decision maker'
                };
            } else if (channel === 'CALL' && targetFromDm('CALL') && !suppressCall) {
                recommendedAction = {
                    type: 'CALL', label: `Call ${name}`, target: targetFromDm('CALL'),
                    target_type: 'person', target_name: name, person_id: dmPerson.id,
                    reason: 'Phone available on decision maker'
                };
            } else if (channel === 'EMAIL' && targetFromDm('EMAIL')) {
                recommendedAction = {
                    type: 'EMAIL', label: `Email ${name}`, target: targetFromDm('EMAIL'),
                    target_type: 'person', target_name: name, person_id: dmPerson.id,
                    reason: 'Email available on decision maker'
                };
            } else if (channel === 'LINKEDIN' && targetFromDm('LINKEDIN')) {
                recommendedAction = {
                    type: 'LINKEDIN', label: `LinkedIn ${name}`, target: targetFromDm('LINKEDIN'),
                    target_type: 'person', target_name: name, person_id: dmPerson.id,
                    reason: 'LinkedIn available on decision maker'
                };
            } else {
                recommendedAction = { type: 'NONE', label: 'No usable contact for decision maker', reason: 'Decision maker has no usable communication channel' };
            }
            reason = recommendedAction.reason;
        } else {
            recommendedAction = { type: 'NONE', label: 'No action yet', reason: 'No outstanding work or usable contact' };
            reason = recommendedAction.reason;
        }

        // Ensure research / DM appear in available when relevant
        if (researchState !== 'COMPLETED' && !availableActions.find(a => a.type === 'RESEARCH')) {
            availableActions.unshift({
                type: 'RESEARCH',
                label: researchState === 'IN_PROGRESS' ? 'Continue Research' : 'Research'
            });
        }
        if (!dmIdentified && !availableActions.find(a => a.type === 'DECISION_MAKER')) {
            availableActions.push({ type: 'DECISION_MAKER', label: 'Decision Maker' });
        }

        // Dedupe by type
        const seen = new Set();
        availableActions = availableActions.filter(a => {
            if (seen.has(a.type)) return false;
            seen.add(a.type);
            return true;
        });

        if (recommendedAction && reason && !recommendedAction.reason) {
            recommendedAction.reason = reason;
        }

        let scoring = null;
        try {
            scoring = await this.scoring.getFullScoring(opportunityId);
        } catch (e) {
            scoring = null;
        }

        return {
            opportunity: {
                id: row.id,
                name: row.name,
                stage: row.stage,
                fit_score: row.fit_score,
                sales_hypothesis: row.sales_hypothesis || row.research_hypothesis,
                next_action: row.next_action,
                next_action_due_at: row.next_action_due_at,
                next_action_reason: row.next_action_reason
            },
            organisation: {
                id: row.org_id,
                name: row.org_name,
                city: row.city,
                province: row.province,
                phone: row.phone,
                email: row.email,
                website: row.website,
                instagram: row.instagram,
                facebook: row.facebook
            },
            research: {
                state: researchState,
                completed_at: row.research_completed_at,
                website_reviewed: row.website_reviewed,
                social_reviewed: row.social_reviewed,
                admin_complexity: row.admin_complexity,
                current_system: row.current_system,
                registration_method: row.registration_method
            },
            decisionMaker: {
                status: dmStatus,
                identified: dmIdentified,
                person: dmPerson
            },
            contact: dmPerson,
            scoring,
            latest_note,
            execution: {
                research_state: researchState,
                decision_maker_state: dmKnown ? (dmIdentified ? 'IDENTIFIED' : 'NOT_IDENTIFIED') : 'UNCERTAIN',
                recommended_action: recommendedAction,
                available_actions: availableActions,
                last_interaction,
                flags
            }
        };
    }

    async recordAction(opportunityId, userId, input) {
        const {
            actionType, outcome, note, nextAction, nextActionDue, nextActionReason,
            clearNextAction = false,
            memory, // optional "what should I remember?"
            actionLabel // optional human label from frontend for subject
        } = input;

        if (!actionType) throw { status: 400, message: 'actionType is required' };
        if (!outcome) throw { status: 400, message: 'outcome is required' };

        if (!ACTION_OUTCOMES[actionType]) {
            throw { status: 400, message: `Invalid actionType: ${actionType}` };
        }
        if (!ACTION_OUTCOMES[actionType].includes(outcome)) {
            throw { status: 400, message: `Invalid outcome "${outcome}" for action ${actionType}` };
        }
        if (nextAction && !VALID_NEXT_ACTIONS.includes(nextAction)) {
            throw { status: 400, message: 'Invalid nextAction' };
        }
        if (nextActionReason && !VALID_NEXT_REASONS.includes(nextActionReason)) {
            throw { status: 400, message: 'Invalid nextActionReason' };
        }
        if (clearNextAction !== false && clearNextAction !== true) {
            throw { status: 400, message: 'Invalid clearNextAction' };
        }

        const oppCheck = await this.db.query(
            'SELECT id FROM opportunities WHERE id = $1 AND deleted_at IS NULL',
            [opportunityId]
        );
        if (oppCheck.rows.length === 0) {
            throw { status: 404, message: 'Opportunity not found' };
        }

        const suggestion = suggestFromOutcome(actionType, outcome);
        const flags = { suggest_close_lost: !!(suggestion && suggestion.suggest_close_lost) };

        const subject = actionLabel || `${actionType} executed`;

        await this.db.query('BEGIN');
        try {
            const activityRes = await this.db.query(
                `INSERT INTO activities (
                    opportunity_id, user_id, type, direction, subject, content, outcome, completed_at
                 ) VALUES ($1, $2, $3, 'outbound', $4, $5, $6, NOW())
                 RETURNING *`,
                [opportunityId, userId, actionType, subject, note || outcome, outcome]
            );

            if (clearNextAction) {
                await this.db.query(
                    `UPDATE opportunities
                     SET next_action = NULL,
                         next_action_due_at = NULL,
                         next_action_reason = NULL,
                         updated_at = NOW()
                     WHERE id = $1 AND deleted_at IS NULL`,
                    [opportunityId]
                );
            } else if (nextAction) {
                await this.db.query(
                    `UPDATE opportunities
                     SET next_action = $1,
                         next_action_due_at = $2,
                         next_action_reason = $3,
                         updated_at = NOW()
                     WHERE id = $4 AND deleted_at IS NULL`,
                    [nextAction, nextActionDue || null, nextActionReason || null, opportunityId]
                );
            }

            // Optional persistent memory → notes table
            if (memory && String(memory).trim().length > 0) {
                await this.db.query(
                    `INSERT INTO notes (opportunity_id, user_id, body)
                     VALUES ($1, $2, $3)`,
                    [opportunityId, userId, String(memory).trim()]
                );
            }

            await this.db.query('COMMIT');

            return {
                success: true,
                activity: activityRes.rows[0],
                next_action: nextAction || null,
                next_action_due_at: nextActionDue || null,
                next_action_reason: nextActionReason || null,
                suggested_next: suggestion
                    ? {
                        next_action: suggestion.next_action,
                        due_at: addBusinessDaysLocal(suggestion.due_days),
                        reason: suggestion.reason
                    }
                    : null,
                flags
            };
        } catch (err) {
            await this.db.query('ROLLBACK');
            throw err;
        }
    }
}
