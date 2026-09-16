import { AuthService } from './service.js';

export default async function authRoutes(fastify, opts) {
    const authService = new AuthService(fastify.db);

    fastify.post('/api/auth/register', async (req, reply) => {
        const { email, name, password } = req.body;
        try {
            const user = await authService.register(email, name, password);
            const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
            reply.send({ user, token });
        } catch (err) {
            reply.status(400).send({ error: err.message });
        }
    });

    fastify.post('/api/auth/login', async (req, reply) => {
        const { email, password } = req.body;
        try {
            const user = await authService.login(email, password);
            const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
            reply.send({ user, token });
        } catch (err) {
            reply.status(401).send({ error: err.message });
        }
    });

    // Protected route to get current user
    fastify.get('/api/auth/me', { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const user = await authService.getMe(req.user.id);
        reply.send(user);
    });
}
