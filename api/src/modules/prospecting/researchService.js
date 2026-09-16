import { ScoringService } from '../scoring/service.js';
import { getResearchModule } from './research/index.js';
import {
    SHARED_RESEARCH_FIELDS,
    buildEmptySharedResearch,
    extractAllowedFields,
    mergeResearchPayloads
} from './research/shared.js';

export class ResearchService {
    constructor(db) {
        this.db = db;
    }

    getOpportunityTypeModule(opportunityType) {
        return getResearchModule(opportunityType);
    }

    normalizeTypeSpecificRecord(record = {}) {
        if (!record || typeof record !== 'object') return {};
        const flattened = { ...record };
        delete flattened.id;
        delete flattened.research_id;
        delete flattened.created_at;
        delete flattened.updated_at;
        return flattened;
    }

    async getOpportunity(opportunityId) {
        const opp = await this.db.query(
            `SELECT id, organisation_id, stage, opportunity_type, sales_hypothesis
             FROM opportunities
             WHERE id = $1 AND deleted_at IS NULL`,
            [opportunityId]
        );

        if (opp.rows.length === 0) {
            throw { status: 404, message: 'Opportunity not found' };
        }

        return opp.rows[0];
    }

    async getSharedResearch(opportunityId) {
        const res = await this.db.query(
            `SELECT * FROM research WHERE opportunity_id = $1`,
            [opportunityId]
        );
        return res.rows[0] || null;
    }

    async getResearchContext(opportunityId) {
        const opportunity = await this.getOpportunity(opportunityId);
        const sharedResearch = await this.getSharedResearch(opportunityId);
        const module = this.getOpportunityTypeModule(opportunity.opportunity_type);
        const typeSpecific = sharedResearch && module && module.getTypeSpecificResearch
            ? await module.getTypeSpecificResearch(this.db, sharedResearch.id)
            : null;

        return {
            opportunityId,
            opportunityType: opportunity.opportunity_type,
            shared: sharedResearch || buildEmptySharedResearch(opportunityId, opportunity.stage),
            typeSpecific: this.normalizeTypeSpecificRecord(typeSpecific || {}),
            metadata: {
                moduleType: module?.type || null,
                fields: module?.fields || [],
                stage: opportunity.stage
            }
        };
    }

    async getResearchContexts(opportunityIds = []) {
        const ids = [...new Set(opportunityIds.filter(Boolean))];
        if (ids.length === 0) return [];

        const opportunitiesRes = await this.db.query(
            `SELECT id, stage, opportunity_type
             FROM opportunities
             WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
            [ids]
        );
        const opportunities = opportunitiesRes.rows;
        if (opportunities.length === 0) return [];

        const sharedRes = await this.db.query(
            `SELECT * FROM research WHERE opportunity_id = ANY($1::uuid[])`,
            [opportunities.map(({ id }) => id)]
        );
        const sharedByOpportunityId = new Map(
            sharedRes.rows.map((research) => [research.opportunity_id, research])
        );
        const typeSpecificByResearchId = new Map();
        const moduleGroups = new Map();

        for (const opportunity of opportunities) {
            const sharedResearch = sharedByOpportunityId.get(opportunity.id);
            const module = this.getOpportunityTypeModule(opportunity.opportunity_type);
            if (!sharedResearch || !module?.table || !module.joinField) continue;

            const key = `${module.table}:${module.joinField}`;
            if (!moduleGroups.has(key)) {
                moduleGroups.set(key, {
                    table: module.table,
                    joinField: module.joinField,
                    researchIds: []
                });
            }
            moduleGroups.get(key).researchIds.push(sharedResearch.id);
        }

        for (const { table, joinField, researchIds } of moduleGroups.values()) {
            const typeSpecificRes = await this.db.query(
                `SELECT * FROM ${table} WHERE ${joinField} = ANY($1::uuid[])`,
                [researchIds]
            );
            for (const record of typeSpecificRes.rows) {
                typeSpecificByResearchId.set(
                    record[joinField],
                    this.normalizeTypeSpecificRecord(record)
                );
            }
        }

        return opportunities.map((opportunity) => {
            const sharedResearch = sharedByOpportunityId.get(opportunity.id);
            const module = this.getOpportunityTypeModule(opportunity.opportunity_type);
            const typeSpecific = sharedResearch
                ? typeSpecificByResearchId.get(sharedResearch.id) || {}
                : {};

            return {
                opportunityId: opportunity.id,
                opportunityType: opportunity.opportunity_type,
                shared: sharedResearch || buildEmptySharedResearch(opportunity.id, opportunity.stage),
                typeSpecific,
                metadata: {
                    moduleType: module?.type || null,
                    fields: module?.fields || [],
                    stage: opportunity.stage
                }
            };
        });
    }

    async getMappedResearch(opportunityId, opportunityType, sharedResearch = null) {
        const researchRow = sharedResearch || await this.getSharedResearch(opportunityId);
        const module = this.getOpportunityTypeModule(opportunityType);

        if (!module || !module.getTypeSpecificResearch) {
            return {
                ...buildEmptySharedResearch(opportunityId, null),
                ...(researchRow || {}),
                opportunity_id: opportunityId
            };
        }

        const typeSpecific = researchRow
            ? await module.getTypeSpecificResearch(this.db, researchRow.id)
            : null;

        return {
            ...buildEmptySharedResearch(opportunityId, null),
            ...(researchRow || {}),
            ...this.normalizeTypeSpecificRecord(typeSpecific || {}),
            opportunity_id: opportunityId
        };
    }

    async getResearch(opportunityId, userId) {
        const context = await this.getResearchContext(opportunityId);
        const merged = {
            ...buildEmptySharedResearch(opportunityId, null),
            ...context.shared,
            ...context.typeSpecific,
            opportunity_id: opportunityId
        };

        return {
            ...merged,
            stage: context.metadata.stage
        };
    }

    async saveResearch(opportunityId, userId, data) {
        const opportunity = await this.db.query(
            `SELECT id, stage, opportunity_type
             FROM opportunities
             WHERE id = $1 AND deleted_at IS NULL AND stage NOT IN ('WON', 'LOST')`,
            [opportunityId]
        );

        if (opportunity.rows.length === 0) {
            throw { status: 404, message: 'Opportunity not found or already closed' };
        }

        const opportunityType = opportunity.rows[0].opportunity_type;
        const module = this.getOpportunityTypeModule(opportunityType);
        const allowedSharedFields = SHARED_RESEARCH_FIELDS;
        const sharedData = extractAllowedFields(data, allowedSharedFields);
        const typeSpecificData = module ? extractAllowedFields(data, module.fields || []) : {};

        if (!Object.keys(sharedData).length && !Object.keys(typeSpecificData).length) {
            return this.getResearch(opportunityId, userId);
        }

        const existing = await this.db.query(
            'SELECT id FROM research WHERE opportunity_id = $1',
            [opportunityId]
        );

        let researchId = existing.rows[0]?.id;
        const sharedFields = [];
        const sharedValues = [];
        let i = 1;

        for (const key of allowedSharedFields) {
            if (sharedData[key] !== undefined && sharedData[key] !== null) {
                sharedFields.push(`${key} = $${i}`);
                sharedValues.push(sharedData[key]);
                i += 1;
            }
        }

        if (sharedFields.length > 0) {
            if (researchId) {
                sharedValues.push(opportunityId);
                const updateQuery = `UPDATE research
                    SET ${sharedFields.join(', ')}, updated_at = NOW()
                    WHERE opportunity_id = $${i}
                    RETURNING *`;
                const updateRes = await this.db.query(updateQuery, sharedValues);
                researchId = updateRes.rows[0]?.id || researchId;
            } else {
                const insertFields = ['opportunity_id', ...allowedSharedFields.filter((field) => sharedData[field] !== undefined && sharedData[field] !== null)];
                const insertValues = [opportunityId, ...insertFields.slice(1).map((field) => sharedData[field])];
                const insertQuery = `INSERT INTO research (${insertFields.join(', ')}) VALUES (${insertFields.map((_, idx) => `$${idx + 1}`).join(', ')}) RETURNING *`;
                const insertRes = await this.db.query(insertQuery, insertValues);
                researchId = insertRes.rows[0]?.id;
            }
        } else {
            researchId = researchId || (existing.rows[0] && existing.rows[0].id);
        }

        if (module && researchId && Object.keys(typeSpecificData).length > 0) {
            await module.saveTypeSpecificResearch(this.db, researchId, typeSpecificData);
        }

        const scoringService = new ScoringService(this.db);
        await scoringService.updateFitScore(opportunityId);

        return this.getResearch(opportunityId, userId);
    }

    async completeResearch(opportunityId, userId) {
        await this.db.query('BEGIN');

        try {
            const opportunity = await this.getOpportunity(opportunityId);
            if (opportunity.stage !== 'TARGETING') {
                throw { status: 409, message: `Opportunity is already ${opportunity.stage}, cannot complete research` };
            }

            const researchRow = await this.getSharedResearch(opportunityId);
            const module = this.getOpportunityTypeModule(opportunity.opportunity_type);
            const typeSpecific = researchRow
                ? await (module && module.getTypeSpecificResearch ? module.getTypeSpecificResearch(this.db, researchRow.id) : Promise.resolve({}))
                : {};

            const merged = mergeResearchPayloads(researchRow || {}, this.normalizeTypeSpecificRecord(typeSpecific));
            const completionErrors = module && typeof module.getCompletionErrors === 'function'
                ? module.getCompletionErrors({ sharedResearch: merged, typeResearch: this.normalizeTypeSpecificRecord(typeSpecific) })
                : [];

            if (completionErrors.length > 0) {
                throw { status: 400, message: 'Research incomplete', errors: completionErrors };
            }

            const updateRes = await this.db.query(
                `UPDATE research SET completed_at = NOW(), updated_at = NOW()
                 WHERE opportunity_id = $1 RETURNING *`,
                [opportunityId]
            );

            const oppUpdate = await this.db.query(
                `UPDATE opportunities
                 SET stage = 'RESEARCHED',
                     sales_hypothesis = COALESCE($1, sales_hypothesis),
                     updated_at = NOW()
                 WHERE id = $2
                 RETURNING *`,
                [merged.sales_hypothesis || opportunity.sales_hypothesis, opportunityId]
            );

            await this.db.query(
                `UPDATE organisations
                 SET research_completed_at = NOW()
                 WHERE id = $1`,
                [opportunity.organisation_id]
            );

            const activityRes = await this.db.query(
                `INSERT INTO activities (opportunity_id, user_id, type, direction, subject, content, completed_at)
                 VALUES ($1, $2, 'research_completed', 'outbound', 'Research completed', $3, NOW())
                 RETURNING *`,
                [opportunityId, userId, `Research completed on ${merged.sales_hypothesis || 'opportunity'}`]
            );

            await this.db.query(
                `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values)
                 VALUES ($1, 'opportunity', $2, 'stage_transition', $3, $4)`,
                [userId, opportunityId, JSON.stringify({ stage: 'TARGETING' }), JSON.stringify({ stage: 'RESEARCHED' })]
            );

            await this.db.query('COMMIT');

            const scoringService = new ScoringService(this.db);
            await scoringService.updateFitScore(opportunityId);

            return {
                research: {
                    ...(updateRes.rows[0] || {}),
                    ...this.normalizeTypeSpecificRecord(typeSpecific || {}),
                    opportunity_id: opportunityId
                },
                opportunity: oppUpdate.rows[0],
                activity: activityRes.rows[0]
            };
        } catch (err) {
            await this.db.query('ROLLBACK');
            throw err;
        }
    }
}