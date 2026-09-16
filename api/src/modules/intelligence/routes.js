import { IntelligenceService } from './service.js';

export default async function intelligenceRoutes(fastify) {
    const service = new IntelligenceService(fastify.db);
    fastify.addHook('preValidation', fastify.authenticate);

    // Explicit generate — does NOT replace GET /api/execution/:id
    fastify.post('/api/intelligence/:opportunityId/run', async (req, reply) => {
        try {
            const result = await service.runForOpportunity(
                req.params.opportunityId,
                req.user.id,
                { trigger_type: 'MANUAL', trigger_source_id: null }
            );
            reply.send(result);
        } catch (err) {
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });

    fastify.get('/api/intelligence/:opportunityId/latest', async (req, reply) => {
        try {
            const result = await service.getLatest(req.params.opportunityId);
            reply.send(result);
        } catch (err) {
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });

    fastify.post('/api/intelligence/:opportunityId/feedback', async (req, reply) => {
        try {
            const result = await service.recordFeedback(req.params.opportunityId, req.user.id, req.body);
            reply.send(result);
        } catch (err) {
            reply.status(err.status || 400).send({ error: err.message || 'Invalid request' });
        }
    });
}
