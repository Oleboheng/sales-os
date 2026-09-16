import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Client } from 'pg';
import dotenv from 'dotenv';
import authPlugin from './plugins/auth.js';

// Import modules
import authRoutes from './modules/auth/routes.js';
import organisationRoutes from './modules/organisations/routes.js';
import contactRoutes from './modules/contacts/routes.js';
import opportunityRoutes from './modules/opportunities/routes.js';
import activityRoutes from './modules/activities/routes.js';
import taskRoutes from './modules/tasks/routes.js';
import noteRoutes from './modules/notes/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import prospectingRoutes from './modules/prospecting/routes.js';
import scoringRoutes from './modules/scoring/routes.js';
import profileRoutes from './modules/profiling/routes.js';
import queueRoutes from './modules/queue/routes.js';
import executionRoutes from './modules/execution/routes.js';
import intelligenceRoutes from './modules/intelligence/routes.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// Database
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
fastify.decorate('db', db);

// Plugins
await fastify.register(cors, { origin: '*' });
await fastify.register(authPlugin);

// Health
fastify.get('/health', async () => ({ status: 'ok' }));

// Routes (all protected except auth)
fastify.register(authRoutes);
fastify.register(organisationRoutes);
fastify.register(contactRoutes);
fastify.register(opportunityRoutes);
fastify.register(activityRoutes);
fastify.register(taskRoutes);
fastify.register(noteRoutes);
fastify.register(dashboardRoutes);
fastify.register(prospectingRoutes);
fastify.register(scoringRoutes);
fastify.register(profileRoutes);
fastify.register(queueRoutes);
fastify.register(executionRoutes);
fastify.register(intelligenceRoutes);

const port = process.env.PORT || 3000;
fastify.listen({ port, host: '0.0.0.0' }, (err) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
});
