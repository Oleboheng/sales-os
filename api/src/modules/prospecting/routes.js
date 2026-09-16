// api/src/modules/prospecting/routes.js
import { ProspectingService } from './service.js';
import { ResearchService } from './researchService.js';

export default async function prospectingRoutes(fastify) {
    const service = new ProspectingService(fastify.db);
    const researchService = new ResearchService(fastify.db);

    // All routes require authentication
    fastify.addHook('preValidation', fastify.authenticate);

    fastify.post('/api/prospecting/quick-capture', async (req, reply) => {
        try {
            const result = await service.quickCapture(req.user.id, req.body);

            // Return appropriate status code
            if (result.status === 'created') {
                return reply.status(201).send(result);
            } else if (result.status === 'existing_organisation' || result.status === 'possible_duplicate') {
                return reply.status(200).send(result);
            }

            return reply.status(200).send(result);

        } catch (err) {
            if (err.status === 400) {
                return reply.status(400).send({
                    error: 'VALIDATION_ERROR',
                    errors: err.errors || [{ message: err.message }]
                });
            }

            fastify.log.error(err);
            return reply.status(500).send({
                error: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred'
            });
        }
    });

    fastify.get('/api/prospecting/:opportunityId/research', async (req, reply) => {
        try {
            const research = await researchService.getResearch(req.params.opportunityId, req.user.id);
            const context = await researchService.getResearchContext(req.params.opportunityId);
            reply.send({
                ...research,
                opportunity_type: context.opportunityType,
                opportunityType: context.opportunityType,
                shared: context.shared,
                typeSpecific: context.typeSpecific,
                metadata: context.metadata
            });
        } catch (err) {
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });

    fastify.patch('/api/prospecting/:opportunityId/research', async (req, reply) => {
        try {
            const result = await researchService.saveResearch(req.params.opportunityId, req.user.id, req.body);
            reply.send(result);
        } catch (err) {
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });

    fastify.post('/api/prospecting/:opportunityId/research/complete', async (req, reply) => {
        try {
            const result = await researchService.completeResearch(req.params.opportunityId, req.user.id);
            reply.send(result);
        } catch (err) {
            if (err.status === 400) {
                return reply.status(400).send({ error: err.message, errors: err.errors });
            }
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });
}