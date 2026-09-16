export default async function activityRoutes(fastify) {
    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/api/opportunities/:oppId/activities', async (req, reply) => {
        const res = await fastify.db.query(
            `SELECT a.*, u.name as user_name
             FROM activities a
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.opportunity_id = $1
             ORDER BY a.completed_at DESC`,
            [req.params.oppId]
        );
        reply.send(res.rows);
    });

    fastify.post('/api/opportunities/:oppId/activities', async (req, reply) => {
        const { type, subject, content, completed_at } = req.body;
        const res = await fastify.db.query(
            `INSERT INTO activities (opportunity_id, user_id, type, subject, content, completed_at)
             VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()))
             RETURNING *`,
            [req.params.oppId, req.user.id, type, subject, content, completed_at]
        );
        reply.status(201).send(res.rows[0]);
    });
}
