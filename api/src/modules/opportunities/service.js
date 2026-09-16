export class OpportunityService {
    constructor(db) {
        this.db = db;
    }

    // List opportunities for an organisation
    async listByOrganisation(orgId, userId) {
        const res = await this.db.query(
            `SELECT o.*, ps.name as stage_name
             FROM opportunities o
             LEFT JOIN pipeline_stages ps ON o.stage = ps.slug
             WHERE o.organisation_id = $1 AND o.deleted_at IS NULL
             ORDER BY o.created_at DESC`,
            [orgId]
        );
        return res.rows;
    }

    async create(orgId, userId, data) {
        const { name, campaign, source, opportunity_type: opportunityType } = data;
        const approvedTypes = ['SPORTS_MANAGEMENT', 'WEBSITE', 'BOOKING_SYSTEM'];
        if (opportunityType !== undefined && !approvedTypes.includes(opportunityType)) {
            throw { status: 400, message: `Opportunity type must be one of: ${approvedTypes.join(', ')}` };
        }
        const res = await this.db.query(
            `INSERT INTO opportunities (
                organisation_id,
                name,
                campaign,
                source,
                stage,
                opportunity_type
             )
             VALUES ($1, $2, $3, $4, 'TARGETING', $5)
             RETURNING *`,
            [orgId, name, campaign, source, opportunityType ?? 'SPORTS_MANAGEMENT']
        );
        // Log activity
        await this.db.query(
            `INSERT INTO activities (opportunity_id, user_id, type, subject, content)
             VALUES ($1, $2, 'note', 'Opportunity created', 'Initial capture')`,
            [res.rows[0].id, userId]
        );
        return res.rows[0];
    }

    async getById(id, userId) {
        const res = await this.db.query(
            `SELECT o.*, ps.name as stage_name
             FROM opportunities o
             LEFT JOIN pipeline_stages ps ON o.stage = ps.slug
             WHERE o.id = $1 AND o.deleted_at IS NULL`,
            [id]
        );
        return res.rows[0];
    }

    // Stage transition with validation
    async transitionStage(id, userId, newStageSlug) {
        // 1. Get current opportunity
        const opp = await this.getById(id, userId);
        if (!opp) throw new Error('Opportunity not found');

        // 2. Get stage details
        const stageRes = await this.db.query(
            'SELECT * FROM pipeline_stages WHERE slug = $1',
            [newStageSlug]
        );
        if (stageRes.rows.length === 0) throw new Error('Invalid stage');
        const newStage = stageRes.rows[0];

        // 3. Validate transition (state machine)
        const allowedTransitions = {
            'targeting': ['researched'],
            'researched': ['permission_requested', 'lost'],
            'permission_requested': ['permission_received', 'lost'],
            'permission_received': ['discovery'],
            'discovery': ['demonstration', 'lost', 'nurture'],
            'demonstration': ['proposal', 'lost'],
            'proposal': ['decision', 'lost'],
            'decision': ['won', 'lost', 'nurture'],
            'nurture': ['targeting'],  // re‑engage
        };

        const current = String(opp.stage || '').toLowerCase();
        const target = String(newStageSlug || '').toLowerCase();
        if (current === target) throw new Error('Already at that stage');
        if (!allowedTransitions[current] || !allowedTransitions[current].includes(target)) {
            throw new Error(`Invalid transition from ${opp.stage} to ${newStageSlug}`);
        }

        // 4. Optional: check exit conditions (simplified – we'll implement later)
        // For now, just allow

        // 5. Begin transaction for atomic writes
        await this.db.query('BEGIN');

        try {
            // Update opportunity
            const updateRes = await this.db.query(
                `UPDATE opportunities SET stage = $1, updated_at = NOW()
                 WHERE id = $2 RETURNING *`,
                [target.toUpperCase(), id]
            );
            const updated = updateRes.rows[0];

            // 6. Log stage history (we could create a separate table, but we'll use activities)
            await this.db.query(
                `INSERT INTO activities (opportunity_id, user_id, type, subject, content)
                 VALUES ($1, $2, 'stage_change', 'Stage changed', $3)`,
                [id, userId, `From ${opp.stage} to ${target}`]
            );

            // 7. Audit log
            await this.db.query(
                `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values)
                 VALUES ($1, 'opportunity', $2, 'stage_transition', $3, $4)`,
                [userId, id, JSON.stringify({ stage: opp.stage }), JSON.stringify({ stage: target.toUpperCase() })]
            );

            // 8. Automatic task creation (example: if moving to PERMISSION_REQUESTED, create follow-up)
            if (target === 'permission_requested') {
                await this.db.query(
                    `INSERT INTO tasks (opportunity_id, assigned_to, user_id, title, description, due_at)
                     VALUES ($1, $2, $2, 'Follow up on permission', 'Check if permission granted', NOW() + INTERVAL '2 days')`,
                    [id, userId]
                );
            }

            await this.db.query('COMMIT');
            return updated;
        } catch (err) {
            await this.db.query('ROLLBACK');
            throw err;
        }
    }
}
