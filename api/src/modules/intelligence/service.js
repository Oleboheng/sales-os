import {
    researchState,
    dmState,
    resolveChannels,
    rankRecommendations,
    buildSignalPlan,
    buildAssessments
} from './engine.js';
import { ResearchService } from '../prospecting/researchService.js';

const ENGINE_VERSION = 'action-intelligence-v1';

export class IntelligenceService {
    constructor(db, researchService = new ResearchService(db)) {
        this.db = db;
        this.researchService = researchService;
        this._defCache = null;
    }

    async loadDefinitions() {
        if (this._defCache) return this._defCache;
        const res = await this.db.query(
            `SELECT id, code FROM intelligence_signal_definitions WHERE active = TRUE`
        );
        this._defCache = new Map(res.rows.map((r) => [r.code, r.id]));
        return this._defCache;
    }

    async loadContext(opportunityId) {
        const oppRes = await this.db.query(
            `SELECT o.*,
                    org.id AS org_id, org.name AS org_name, org.phone AS org_phone, org.email AS org_email,
                    p.id AS person_id, p.first_name, p.last_name, p.role, p.title,
                    p.email AS person_email, p.phone_primary, p.phone_whatsapp, p.linkedin
             FROM opportunities o
             JOIN organisations org ON org.id = o.organisation_id
             LEFT JOIN people p ON p.id = o.decision_maker_person_id
             WHERE o.id = $1 AND o.deleted_at IS NULL`,
            [opportunityId]
        );
        if (oppRes.rows.length === 0) {
            throw { status: 404, message: 'Opportunity not found' };
        }
        const row = oppRes.rows[0];
        const researchContext = await this.researchService.getResearchContext(opportunityId);
        const sharedResearch = researchContext.shared || {};

        const opportunity = {
            id: row.id,
            name: row.name,
            stage: row.stage,
            organisation_id: row.organisation_id,
            opportunity_type: row.opportunity_type,
            decision_maker_status: row.decision_maker_status,
            decision_maker_person_id: row.decision_maker_person_id,
            next_action: row.next_action,
            next_action_due_at: row.next_action_due_at,
            next_action_reason: row.next_action_reason,
            fit_score: row.fit_score,
            sales_hypothesis: row.sales_hypothesis
        };
        const organisation = {
            id: row.org_id,
            name: row.org_name,
            phone: row.org_phone,
            email: row.org_email
        };
                const research = sharedResearch.id
            ? {
                                    id: sharedResearch.id,
                                    completed_at: sharedResearch.completed_at,
                                    website_reviewed: sharedResearch.website_reviewed,
                                    social_reviewed: sharedResearch.social_reviewed
              }
            : null;
        const dmPerson = row.person_id
            ? {
                  id: row.person_id,
                  first_name: row.first_name,
                  last_name: row.last_name,
                  role: row.role,
                  title: row.title,
                  email: row.person_email,
                  phone_primary: row.phone_primary,
                  phone_whatsapp: row.phone_whatsapp,
                  linkedin: row.linkedin
              }
            : null;

        const peopleRes = await this.db.query(
            `SELECT id, first_name, last_name, role, title, email,
                    phone_primary, phone_whatsapp, linkedin
             FROM people
             WHERE organisation_id = $1
               
             ORDER BY last_name NULLS LAST, first_name NULLS LAST`,
            [row.organisation_id]
        );
        // If people has no deleted_at column, remove that AND clause after one failed query.
        const people = peopleRes.rows.map((p) => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            role: p.role,
            title: p.title,
            email: p.email,
            phone_primary: p.phone_primary,
            phone_whatsapp: p.phone_whatsapp,
            linkedin: p.linkedin
        }));

        const actRes = await this.db.query(
            `SELECT id, type, outcome, subject, content, completed_at
             FROM activities
             WHERE opportunity_id = $1
             ORDER BY completed_at DESC NULLS LAST, created_at DESC
             LIMIT 1`,
            [opportunityId]
        );
        const lastActivity = actRes.rows[0] || null;

        const taskRes = await this.db.query(
            `SELECT id, title, due_at, status
             FROM tasks
             WHERE opportunity_id = $1
               AND (status IS NULL OR status NOT IN ('completed', 'cancelled', 'done'))
             ORDER BY due_at ASC NULLS LAST
             LIMIT 1`,
            [opportunityId]
        );
        const pendingTask = taskRes.rows[0] || null;

        const dm = dmState(opportunity);
        const channels = resolveChannels({ dmPerson, organisation, dm });

        return {
            opportunity,
            organisation,
            research,
            dmPerson,
            people,
            lastActivity,
            pendingTask,
            channels,
            dm,
            research_state: researchState(research)
        };
    }

    async runForOpportunity(opportunityId, userId, opts = {}) {
        const ctx = await this.loadContext(opportunityId);
        const defs = await this.loadDefinitions();

        const runIns = await this.db.query(
            `INSERT INTO intelligence_runs (
                opportunity_id, run_type, engine_type, engine_version,
                trigger_type, trigger_source_id, status, input_snapshot
             ) VALUES ($1, 'ACTION_RECOMMENDATION', 'RULE_ENGINE', $2, $3, $4, 'RUNNING', $5)
             RETURNING *`,
            [
                opportunityId,
                ENGINE_VERSION,
                opts.trigger_type || 'MANUAL',
                opts.trigger_source_id || null,
                JSON.stringify({
                    research_state: ctx.research_state,
                    decision_maker_status: ctx.opportunity.decision_maker_status,
                    decision_maker_person_id: ctx.opportunity.decision_maker_person_id,
                    next_action: ctx.opportunity.next_action,
                    next_action_due_at: ctx.opportunity.next_action_due_at,
                    channels: ctx.channels,
                    last_activity: ctx.lastActivity
                        ? {
                              type: ctx.lastActivity.type,
                              outcome: ctx.lastActivity.outcome,
                              completed_at: ctx.lastActivity.completed_at
                          }
                        : null
                })
            ]
        );
        const run = runIns.rows[0];

        try {
            const signalPlan = buildSignalPlan(ctx);
            const persistedSignals = [];
            for (const s of signalPlan) {
                const defId = defs.get(s.code);
                if (!defId) continue;
                const row = await this.upsertSignal(opportunityId, defId, s);
                if (row) persistedSignals.push(row);
            }

            const codeSet = new Set(signalPlan.map((s) => s.code));
            const assessmentPlan = buildAssessments(ctx, codeSet);
            const persistedAssessments = [];
            for (const a of assessmentPlan) {
                const row = await this.upsertAssessment(opportunityId, run.id, a);
                if (row) persistedAssessments.push(row);
            }

            const { recommendations, suppressed } = rankRecommendations(ctx);

            // Supersede prior ACTIVE recommendations
            await this.db.query(
                `UPDATE intelligence_recommendations
                 SET status = 'SUPERSEDED', updated_at = NOW()
                 WHERE opportunity_id = $1 AND status = 'ACTIVE'`,
                [opportunityId]
            );

            const persistedRecs = [];
            for (const rec of recommendations) {
                if (!rec.target_id) continue;
                const ins = await this.db.query(
                    `INSERT INTO intelligence_recommendations (
                        opportunity_id, run_id, action_type, priority, priority_score,
                        target_type, target_id, target_label, channel, reason, confidence,
                        status, rank, metadata
                     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ACTIVE',$12,$13)
                     RETURNING *`,
                    [
                        opportunityId,
                        run.id,
                        rec.action_type,
                        rec.priority,
                        rec.priority_score,
                        rec.target_type,
                        rec.target_id,
                        rec.target_label,
                        rec.channel,
                        rec.reason,
                        rec.confidence,
                        rec.rank,
                        JSON.stringify({
                            evidence_codes: rec.evidence_codes || [],
                            is_user_intent_aligned: !!rec.is_user_intent_aligned,
                            destination: rec.destination || null
                        })
                    ]
                );
                const saved = ins.rows[0];
                for (const code of rec.evidence_codes || []) {
                    const sig = persistedSignals.find((x) => {
                        // match by joining definition — approximate via plan
                        return true;
                    });
                    await this.db.query(
                        `INSERT INTO intelligence_recommendation_evidence (
                            recommendation_id, evidence_type, polarity, explanation, weight
                         ) VALUES ($1, $2, 'SUPPORTS', $3, 1.0)`,
                        [saved.id, code, `${code}: supports ${rec.action_type}`]
                    );
                }
                for (const sup of suppressed) {
                    if (sup.action_type === rec.action_type) continue;
                }
                persistedRecs.push(saved);
            }

            // Evidence for suppressions (as CONTEXT on run summary; optional rows)
            for (const sup of suppressed) {
                // attach CONTRADICTS to first related rec if any, else store in output only
            }

            for (const rec of persistedRecs) {
                for (const sup of suppressed) {
                    if (sup.action_type === 'CALL' && rec.action_type !== 'CALL') {
                        await this.db.query(
                            `INSERT INTO intelligence_recommendation_evidence (
                                recommendation_id, evidence_type, polarity, explanation, weight
                             ) VALUES ($1, 'WRONG_NUMBER', 'CONTEXT', $2, 0.5)
                             ON CONFLICT DO NOTHING`,
                            [rec.id, sup.reason]
                        ).catch(() => {});
                    }
                }
            }

            const output_summary = {
                recommendation_count: persistedRecs.length,
                suppressed_count: suppressed.length,
                top: persistedRecs[0]
                    ? { action_type: persistedRecs[0].action_type, rank: persistedRecs[0].rank }
                    : null
            };

            await this.db.query(
                `UPDATE intelligence_runs
                 SET status = 'COMPLETED', completed_at = NOW(), output_summary = $2
                 WHERE id = $1`,
                [run.id, JSON.stringify(output_summary)]
            );

            return {
                run: { ...run, status: 'COMPLETED', output_summary },
                user_intent: {
                    next_action: ctx.opportunity.next_action,
                    next_action_due_at: ctx.opportunity.next_action_due_at,
                    next_action_reason: ctx.opportunity.next_action_reason
                },
                context: {
                    research_state: ctx.research_state,
                    decision_maker_status: ctx.opportunity.decision_maker_status,
                    decision_maker_person_id: ctx.opportunity.decision_maker_person_id
                },
                signals: persistedSignals,
                assessments: persistedAssessments,
                recommendations: persistedRecs,
                people: ctx.people,
                suppressed_actions: suppressed,
                engine: { type: 'RULE_ENGINE', version: ENGINE_VERSION }
            };
        } catch (err) {
            await this.db.query(
                `UPDATE intelligence_runs
                 SET status = 'FAILED', completed_at = NOW(),
                     error_message = $2
                 WHERE id = $1`,
                [run.id, err.message || String(err)]
            );
            throw err;
        }
    }

    async upsertSignal(opportunityId, definitionId, s) {
        const existing = await this.db.query(
            `SELECT s.*
             FROM intelligence_signals s
             WHERE s.opportunity_id = $1
               AND s.definition_id = $2
               AND s.subject_type = $3
               AND s.subject_id IS NOT DISTINCT FROM $4
               AND s.status = 'ACTIVE'
             ORDER BY s.observed_at DESC
             LIMIT 1`,
            [opportunityId, definitionId, s.subject_type, s.subject_id || null]
        );

        const sameValue =
            existing.rows[0] &&
            existing.rows[0].value_boolean === (s.value_boolean ?? null) &&
            existing.rows[0].value_text === (s.value_text ?? null);

        if (sameValue) {
            return existing.rows[0];
        }

        if (existing.rows[0]) {
            await this.db.query(
                `UPDATE intelligence_signals SET status = 'SUPERSEDED', updated_at = NOW() WHERE id = $1`,
                [existing.rows[0].id]
            );
        }

        const ins = await this.db.query(
            `INSERT INTO intelligence_signals (
                opportunity_id, definition_id, subject_type, subject_id,
                value_type, value_text, value_boolean,
                source_type, source_id, confidence, status, supersedes_id
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ACTIVE',$11)
             RETURNING *`,
            [
                opportunityId,
                definitionId,
                s.subject_type,
                s.subject_id || null,
                s.value_type || 'BOOLEAN',
                s.value_text || null,
                s.value_boolean ?? true,
                s.source_type || 'SYSTEM_RULE',
                s.source_id || null,
                s.confidence ?? 1.0,
                existing.rows[0]?.id || null
            ]
        );
        return ins.rows[0];
    }

    async upsertAssessment(opportunityId, runId, a) {
        await this.db.query(
            `UPDATE intelligence_assessments
             SET status = 'SUPERSEDED', updated_at = NOW()
             WHERE opportunity_id = $1 AND assessment_type = $2 AND status = 'ACTIVE'`,
            [opportunityId, a.assessment_type]
        );
        const ins = await this.db.query(
            `INSERT INTO intelligence_assessments (
                opportunity_id, assessment_type, subject_type, subject_id,
                value_type, value_text, confidence, status, engine_run_id
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE',$8)
             RETURNING *`,
            [
                opportunityId,
                a.assessment_type,
                a.subject_type,
                a.subject_id || null,
                a.value_type,
                a.value_text,
                a.confidence,
                runId
            ]
        );
        return ins.rows[0];
    }

    async getLatest(opportunityId) {
        const runRes = await this.db.query(
            `SELECT * FROM intelligence_runs
             WHERE opportunity_id = $1 AND status = 'COMPLETED'
             ORDER BY completed_at DESC NULLS LAST
             LIMIT 1`,
            [opportunityId]
        );
        const recRes = await this.db.query(
            `SELECT * FROM intelligence_recommendations
             WHERE opportunity_id = $1 AND status = 'ACTIVE'
             ORDER BY rank ASC`,
            [opportunityId]
        );
        const assessRes = await this.db.query(
            `SELECT * FROM intelligence_assessments
             WHERE opportunity_id = $1 AND status = 'ACTIVE'`,
            [opportunityId]
        );
        const ctx = await this.loadContext(opportunityId);
        return {
            run: runRes.rows[0] || null,
            recommendations: recRes.rows,
            assessments: assessRes.rows,
            user_intent: {
                next_action: ctx.opportunity.next_action,
                next_action_due_at: ctx.opportunity.next_action_due_at,
                next_action_reason: ctx.opportunity.next_action_reason
            },
            engine: { type: 'RULE_ENGINE', version: ENGINE_VERSION }
        };
    }

    async recordFeedback(opportunityId, userId, body = {}) {
        const ins = await this.db.query(
            `INSERT INTO intelligence_feedback (
                opportunity_id, recommendation_id, run_id, feedback_type,
                recommended_action, actual_action,
                recommended_target_type, recommended_target_id,
                actual_target_type, actual_target_id,
                outcome, reason, metadata
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             RETURNING *`,
            [
                opportunityId,
                body.recommendation_id || null,
                body.run_id || null,
                body.feedback_type || 'ACTION_EXECUTED',
                body.recommended_action || null,
                body.actual_action || null,
                body.recommended_target_type || null,
                body.recommended_target_id || null,
                body.actual_target_type || null,
                body.actual_target_id || null,
                body.outcome || null,
                body.reason || null,
                JSON.stringify({ user_id: userId, ...(body.metadata || {}) })
            ]
        );
        return ins.rows[0];
    }
}