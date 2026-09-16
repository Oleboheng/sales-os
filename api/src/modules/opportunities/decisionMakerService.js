import { ScoringService } from '../scoring/service.js';
export class DecisionMakerService {
    constructor(db) {
        this.db = db;
    }
    // Get current decision-maker state for an opportunity
    async getState(opportunityId, userId) {
        const opp = await this.db.query(
            `SELECT o.*, 
                    p.id as person_id, p.first_name, p.last_name, p.role, p.title,
                    p.email, p.phone_primary, p.phone_whatsapp, p.linkedin,
                    p.authority_level, p.confidence_level, p.preferred_channel, p.intelligence_evidence
             FROM opportunities o
             LEFT JOIN people p ON o.decision_maker_person_id = p.id
             WHERE o.id = $1 AND o.deleted_at IS NULL`,
            [opportunityId]
        );
        if (opp.rows.length === 0) {
            throw { status: 404, message: 'Opportunity not found' };
        }
        const row = opp.rows[0];
        return {
            opportunity_id: row.id,
            decision_maker_status: row.decision_maker_status || 'NOT_IDENTIFIED',
            decision_maker_notes: row.decision_maker_notes || null,
            person: row.person_id ? {
                id: row.person_id,
                first_name: row.first_name,
                last_name: row.last_name,
                role: row.role,
                title: row.title,
                email: row.email,
                phone_primary: row.phone_primary,
                phone_whatsapp: row.phone_whatsapp,
                linkedin: row.linkedin,
                authority_level: row.authority_level || 'UNKNOWN',
                confidence_level: row.confidence_level || 'UNKNOWN',
                preferred_channel: row.preferred_channel || 'UNKNOWN',
                intelligence_evidence: row.intelligence_evidence || null
            } : null
        };
    }
    // Update decision-maker state for an opportunity
    async updateState(opportunityId, userId, input) {
        const { status, person_id, notes, person_updates } = input;
        // 1. Validate status
        const validStatuses = ['IDENTIFIED', 'UNCERTAIN', 'NOT_IDENTIFIED'];
        if (!status || !validStatuses.includes(status)) {
            throw { status: 400, message: 'Invalid decision_maker_status' };
        }
        // 2. Get opportunity + capture OLD decision-maker state BEFORE any write
        const opp = await this.db.query(
            `SELECT id, organisation_id, decision_maker_status, decision_maker_person_id
             FROM opportunities
             WHERE id = $1 AND deleted_at IS NULL`,
            [opportunityId]
        );
        if (opp.rows.length === 0) {
            throw { status: 404, message: 'Opportunity not found' };
        }
        const orgId = opp.rows[0].organisation_id;
        const oldStatus = opp.rows[0].decision_maker_status || 'NOT_IDENTIFIED';
        const oldPersonId = opp.rows[0].decision_maker_person_id || null;
        // 3. Validate person if provided
        let personId = person_id || null;
        if (personId) {
            const personRes = await this.db.query(
                'SELECT id FROM people WHERE id = $1 AND organisation_id = $2',
                [personId, orgId]
            );
            if (personRes.rows.length === 0) {
                throw { status: 400, message: 'Person does not belong to this organisation' };
            }
        }
        // 4. If status is NOT_IDENTIFIED, person must be null
        if (status === 'NOT_IDENTIFIED' && personId) {
            throw { status: 400, message: 'Cannot have a person when status is NOT_IDENTIFIED' };
        }
        // If status is IDENTIFIED, person must be provided
        if (status === 'IDENTIFIED' && !personId) {
            throw { status: 400, message: 'A person must be selected when status is IDENTIFIED' };
        }
        // 5. Begin transaction
        await this.db.query('BEGIN');
        try {
            // 6. Update person intelligence if person_id provided and person_updates given
            if (personId && person_updates) {
                const allowedPersonFields = [
                    'authority_level', 'confidence_level', 'preferred_channel', 'intelligence_evidence'
                ];
                const fields = [];
                const values = [];
                let i = 1;
                for (const key of allowedPersonFields) {
                    if (person_updates[key] !== undefined && person_updates[key] !== null) {
                        fields.push(`${key} = $${i}`);
                        values.push(person_updates[key]);
                        i++;
                    }
                }
                if (fields.length > 0) {
                    values.push(personId);
                    await this.db.query(
                        `UPDATE people SET ${fields.join(', ')}, updated_at = NOW()
                         WHERE id = $${i}`,
                        values
                    );
                }
            }
            // 7. Update opportunity decision-maker fields
            const updateFields = [
                'decision_maker_status = $1',
                'decision_maker_person_id = $2',
                'decision_maker_notes = $3',
                'updated_at = NOW()'
            ];
            const values2 = [status, personId, notes || null];
            const query = `UPDATE opportunities
                           SET ${updateFields.join(', ')}
                           WHERE id = $4
                           RETURNING *`;
            values2.push(opportunityId);
            const res = await this.db.query(query, values2);
            const updatedOpp = res.rows[0];
            // 8. Create activity + audit only when state actually changed
            // (oldStatus / oldPersonId were captured before the UPDATE)
            if (oldStatus !== status || oldPersonId !== personId) {
                const activityType = 'decision_maker_updated';
                await this.db.query(
                    `INSERT INTO activities (opportunity_id, user_id, type, direction, subject, content, completed_at)
                     VALUES ($1, $2, $3, 'outbound', $4, $5, NOW())`,
                    [
                        opportunityId,
                        userId,
                        activityType,
                        `Decision maker ${status.toLowerCase()}`,
                        `Status: ${status}. Person: ${personId || 'none'}. Notes: ${notes || ''}`
                    ]
                );
                // Audit log
                await this.db.query(
                    `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values)
                     VALUES ($1, 'opportunity', $2, 'decision_maker_updated', $3, $4)`,
                    [
                        userId,
                        opportunityId,
                        JSON.stringify({
                            decision_maker_status: oldStatus,
                            decision_maker_person_id: oldPersonId
                        }),
                        JSON.stringify({
                            decision_maker_status: status,
                            decision_maker_person_id: personId
                        })
                    ]
                );
            }
            await this.db.query('COMMIT');
            // Recalculate score after decision-maker update
            const scoringService = new ScoringService(this.db);
            await scoringService.updateFitScore(opportunityId);
            // Return updated state
            return await this.getState(opportunityId, userId);
        } catch (err) {
            await this.db.query('ROLLBACK');
            throw err;
        }
    }
}
