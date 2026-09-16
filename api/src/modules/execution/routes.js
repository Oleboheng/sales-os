import { ExecutionService } from './service.js';

export default async function executionRoutes(fastify) {
    const service = new ExecutionService(fastify.db);

    fastify.addHook('preValidation', fastify.authenticate);

    // Get execution context
    fastify.get('/api/execution/:opportunityId', async (req, reply) => {
        try {
            const context = await service.getExecutionContext(req.params.opportunityId, req.user.id);
            reply.send(context);
        } catch (err) {
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });

    // Record action outcome
    fastify.post('/api/execution/:opportunityId/record', async (req, reply) => {
        try {
            const result = await service.recordAction(req.params.opportunityId, req.user.id, req.body);
            reply.send(result);
        } catch (err) {
            reply.status(err.status || 400).send({ error: err.message || 'Invalid request' });
        }
    });
}
