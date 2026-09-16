export default async function taskRoutes(fastify) {
    fastify.addHook('preValidation', fastify.authenticate);

    // Today's tasks
    fastify.get('/api/tasks/today', async (req, reply) => {
        const res = await fastify.db.query(
            `SELECT t.*, o.name as org_name, opp.name as opportunity_name
             FROM tasks t
             LEFT JOIN opportunities opp ON t.opportunity_id = opp.id
             LEFT JOIN organisations o ON opp.organisation_id = o.id
             WHERE t.assigned_to = $1 AND t.status = 'pending'
               AND t.due_at::date <= NOW()::date
             ORDER BY t.due_at ASC`,
            [req.user.id]
        );
        reply.send(res.rows);
    });

    fastify.post('/api/opportunities/:oppId/tasks', async (req, reply) => {
        const { title, description, due_at, priority } = req.body;
        const res = await fastify.db.query(
            `INSERT INTO tasks (opportunity_id, assigned_to, user_id, title, description, due_at, priority)
             VALUES ($1, $2, $2, $3, $4, $5, $6) RETURNING *`,
            [req.params.oppId, req.user.id, title, description, due_at, priority || 'medium']
        );
        reply.status(201).send(res.rows[0]);
    });

    fastify.patch('/api/tasks/:id/complete', async (req, reply) => {
        const res = await fastify.db.query(
            `UPDATE tasks SET status = 'completed', completed_at = NOW()
             WHERE id = $1 AND assigned_to = $2 RETURNING *`,
            [req.params.id, req.user.id]
        );
        if (res.rows.length === 0) reply.status(404).send({ error: 'Not found' });
        else reply.send(res.rows[0]);
    });
}
