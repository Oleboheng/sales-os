import { ScoringService } from './service.js';

export default async function scoringRoutes(fastify) {
    const service = new ScoringService(fastify.db);

    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/api/opportunities/:id/scoring', async (req, reply) => {
        try {
            const result = await service.getFullScoring(req.params.id);
            reply.send(result);
        } catch (err) {
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });
}
