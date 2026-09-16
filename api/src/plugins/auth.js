import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export default fp(async (fastify) => {
    fastify.register(jwt, {
        secret: process.env.JWT_SECRET,
        sign: { expiresIn: '7d' }
    });

    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    fastify.decorate('requireRole', (role) => {
        return async (request, reply) => {
            await request.jwtVerify();
            if (request.user.role !== role && request.user.role !== 'owner') {
                reply.status(403).send({ error: 'Forbidden' });
            }
        };
    });
});
