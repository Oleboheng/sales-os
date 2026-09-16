import { ProfileService } from './service.js';

export default async function profileRoutes(fastify) {
    const service = new ProfileService(fastify.db);

    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/api/opportunities/:id/profile', async (req, reply) => {
        try {
            const profile = await service.getProfile(req.params.id, req.user.id);
            reply.send(profile);
        } catch (err) {
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });
}
