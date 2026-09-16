export default async function organisationRoutes(fastify) {
    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/api/organisations', async (req, reply) => {
        const res = await fastify.db.query('SELECT * FROM organisations WHERE deleted_at IS NULL ORDER BY created_at DESC');
        reply.send(res.rows);
    });

    fastify.post('/api/organisations', async (req, reply) => {
        const { name, province, city, website, email, phone, industry } = req.body;
        const res = await fastify.db.query(
            `INSERT INTO organisations (name, province, city, website, email, phone, industry)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, province, city, website, email, phone, industry || 'football-academy']
        );
        reply.status(201).send(res.rows[0]);
    });

    fastify.get('/api/organisations/:id', async (req, reply) => {
        const res = await fastify.db.query('SELECT * FROM organisations WHERE id = $1', [req.params.id]);
        if (res.rows.length === 0) return reply.status(404).send({ error: 'Organisation not found' });
        reply.send(res.rows[0]);
    });
}
