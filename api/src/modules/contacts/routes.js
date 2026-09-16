import { ContactService } from './service.js';

export default async function contactRoutes(fastify) {
    const service = new ContactService(fastify.db);
    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/api/organisations/:orgId/contacts', async (req, reply) => {
        const contacts = await service.listByOrganisation(req.params.orgId);
        reply.send(contacts);
    });

    fastify.post('/api/organisations/:orgId/contacts', async (req, reply) => {
        const contact = await service.create(req.params.orgId, req.body);
        reply.status(201).send(contact);
    });

    fastify.patch('/api/contacts/:id', async (req, reply) => {
        try {
            const contact = await service.update(req.params.id, req.user.id, req.body);
            reply.send(contact);
        } catch (err) {
            reply.status(err.status || 500).send({ error: err.message || 'Internal error' });
        }
    });

    fastify.delete('/api/contacts/:id', async (req, reply) => {
        await service.delete(req.params.id);
        reply.status(204).send();
    });
}