import { QueueService } from './service.js';

export default async function queueRoutes(fastify) {
    const service = new QueueService(fastify.db);

    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/api/prospecting/queue', async (req, reply) => {
        const { filter } = req.query;
        try {
            const queue = await service.getQueue(req.user.id, filter || 'all');
            reply.send(queue);
        } catch (err) {
            fastify.log.error(err);
            reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
