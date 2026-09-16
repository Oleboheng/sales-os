export default async function dashboardRoutes(fastify) {
    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/api/dashboard/today', async (req, reply) => {
        const userId = req.user.id;

        // 1. Counts by task type (research, outreach, calls, follow-ups, proposals)
        const taskRes = await fastify.db.query(
            `SELECT type, COUNT(*) as count
             FROM tasks
             WHERE assigned_to = $1 AND status = 'pending' AND due_at::date <= NOW()::date
             GROUP BY type`,
            [userId]
        );
        const counts = {};
        taskRes.rows.forEach(row => { counts[row.type] = parseInt(row.count); });

        // 2. Next best action (highest priority pending task)
        const nextRes = await fastify.db.query(
            `SELECT t.*, o.name as org_name, opp.name as opportunity_name, opp.stage
             FROM tasks t
             LEFT JOIN opportunities opp ON t.opportunity_id = opp.id
             LEFT JOIN organisations o ON opp.organisation_id = o.id
             WHERE t.assigned_to = $1 AND t.status = 'pending'
             ORDER BY
                 CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                 t.due_at ASC
             LIMIT 1`,
            [userId]
        );
        const nextAction = nextRes.rows[0] || null;

        // 3. Pipeline summary (opportunity count by stage)
        const stageRes = await fastify.db.query(
            `SELECT stage, COUNT(*) as count
             FROM opportunities
             WHERE deleted_at IS NULL AND stage NOT IN ('WON', 'LOST')
             GROUP BY stage
             ORDER BY stage`
        );
        const pipeline = {};
        stageRes.rows.forEach(row => { pipeline[row.stage] = parseInt(row.count); });

        reply.send({
            today: {
                research: counts['research'] || 0,
                outreach: counts['outreach'] || 0,
                calls: counts['call'] || 0,
                followUps: counts['follow-up'] || 0,
                proposals: counts['proposal'] || 0,
            },
            nextAction,
            pipeline,
            timestamp: new Date().toISOString()
        });
    });
}
