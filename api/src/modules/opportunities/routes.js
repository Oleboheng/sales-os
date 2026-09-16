import { OpportunityService } from './service.js';
import { DecisionMakerService } from './decisionMakerService.js';

export default async function opportunityRoutes(fastify) {
    const service = new OpportunityService(fastify.db);

    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/api/organisations/:orgId/opportunities', async (req, reply) => {
        const opps = await service.listByOrganisation(req.params.orgId, req.user.id);
        reply.send(opps);
    });

    fastify.post('/api/organisations/:orgId/opportunities', async (req, reply) => {
        const opp = await service.create(req.params.orgId, req.user.id, req.body);
        reply.status(201).send(opp);
    });

    fastify.get('/api/opportunities/:id', async (req, reply) => {
        const opp = await service.getById(req.params.id, req.user.id);
        if (!opp) reply.status(404).send({ error: 'Not found' });
        else reply.send(opp);
    });

    fastify.post('/api/opportunities/:id/stage', async (req, reply) => {
        const { stage } = req.body;
        try {
            const updated = await service.transitionStage(req.params.id, req.user.id, stage);
            reply.send(updated);
        } catch (err) {
            reply.status(400).send({ error: err.message });
        }
    });

    fastify.get('/api/opportunities/:id/decision-maker', async (req, reply) => {
        try {
            const decisionMakerService = new DecisionMakerService(fastify.db);
            const state = await decisionMakerService.getState(req.params.id, req.user.id);
            reply.send(state);
        } catch (err) {
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });

    fastify.put('/api/opportunities/:id/decision-maker', async (req, reply) => {
        try {
            const decisionMakerService = new DecisionMakerService(fastify.db);
            const state = await decisionMakerService.updateState(req.params.id, req.user.id, req.body);
            reply.send(state);
        } catch (err) {
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });
}