export default async function noteRoutes(fastify) {
    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/api/opportunities/:oppId/notes', async (req, reply) => {
        const res = await fastify.db.query(
            `SELECT n.*, u.name as user_name
             FROM notes n
             LEFT JOIN users u ON n.user_id = u.id
             WHERE n.opportunity_id = $1
             ORDER BY n.created_at DESC`,
            [req.params.oppId]
        );
        reply.send(res.rows);
    });

    fastify.post('/api/opportunities/:oppId/notes', async (req, reply) => {
        const { body } = req.body;
        if (!body || body.trim().length === 0) {
            return reply.status(400).send({ error: 'Note body is required' });
        }
        const res = await fastify.db.query(
            `INSERT INTO notes (opportunity_id, user_id, body)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [req.params.oppId, req.user.id, body]
        );
        reply.status(201).send(res.rows[0]);
    });

    fastify.delete('/api/notes/:id', async (req, reply) => {
        const res = await fastify.db.query(
            `DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id`,
            [req.params.id, req.user.id]
        );
        if (res.rows.length === 0) {
            reply.status(404).send({ error: 'Note not found or unauthorized' });
        } else {
            reply.status(204).send();
        }
    });
}
