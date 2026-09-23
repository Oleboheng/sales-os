import { QueueService } from '../queue/service.js';

export default async function dashboardRoutes(fastify) {
    const queueService = new QueueService(fastify.db);

    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/api/dashboard/today', async (req, reply) => {
        const userId = req.user.id;

        try {
            /*
             * Dashboard is a read-only operational view.
             *
             * PostgreSQL remains the source of truth.
             * No intelligence runs, scoring updates, tasks, or
             * opportunity mutations are performed here.
             */

            // 1. Authenticated user
            const userRes = await fastify.db.query(
                `SELECT id, name, email, role
                 FROM users
                 WHERE id = $1`,
                [userId]
            );

            const user = userRes.rows[0] || null;

            // 2. User-specific task summary
            const taskRes = await fastify.db.query(
                `SELECT
                    COUNT(*) FILTER (
                        WHERE status = 'pending'
                          AND due_at::date = CURRENT_DATE
                    ) AS due_today,

                    COUNT(*) FILTER (
                        WHERE status = 'pending'
                          AND due_at < NOW()
                    ) AS overdue,

                    COUNT(*) FILTER (
                        WHERE status = 'pending'
                    ) AS pending,

                    COUNT(*) FILTER (
                        WHERE status = 'pending'
                          AND type = 'research'
                          AND due_at::date <= CURRENT_DATE
                    ) AS research,

                    COUNT(*) FILTER (
                        WHERE status = 'pending'
                          AND type = 'outreach'
                          AND due_at::date <= CURRENT_DATE
                    ) AS outreach,

                    COUNT(*) FILTER (
                        WHERE status = 'pending'
                          AND type = 'call'
                          AND due_at::date <= CURRENT_DATE
                    ) AS calls,

                    COUNT(*) FILTER (
                        WHERE status = 'pending'
                          AND type = 'follow-up'
                          AND due_at::date <= CURRENT_DATE
                    ) AS follow_ups,

                    COUNT(*) FILTER (
                        WHERE status = 'pending'
                          AND type = 'proposal'
                          AND due_at::date <= CURRENT_DATE
                    ) AS proposals

                 FROM tasks
                 WHERE assigned_to = $1`,
                [userId]
            );

            const taskSummary = taskRes.rows[0] || {};

            // 3. Shared pipeline summary
            const pipelineRes = await fastify.db.query(
                `SELECT stage, COUNT(*)::int AS count
                 FROM opportunities
                 WHERE deleted_at IS NULL
                   AND stage NOT IN ('WON', 'LOST')
                 GROUP BY stage
                 ORDER BY
                    CASE stage
                        WHEN 'TARGETING' THEN 1
                        WHEN 'RESEARCH' THEN 2
                        WHEN 'DISCOVERY' THEN 3
                        WHEN 'QUALIFIED' THEN 4
                        WHEN 'PROPOSAL' THEN 5
                        ELSE 99
                    END,
                    stage`
            );

            const pipeline = pipelineRes.rows.reduce((result, row) => {
                result[row.stage] = row.count;
                return result;
            }, {});

            // 4. Existing intelligent queue.
            // QueueService is the operational source of truth for
            // priority, due dates, research state and next actions.
            const queue = await queueService.getQueue(userId, 'all');

            // Dashboard metrics intentionally reuse QueueService
            // semantics so the Dashboard and Queue cannot drift apart.
            const dueToday = queue.filter(
                item => item.priority === 'due-today'
            ).length;

            const overdue = queue.filter(
                item => item.priority === 'overdue'
            ).length;

            const needsAttention = queue.filter(
                item => [
                    'active-followup',
                    'qualified-ready',
                    'research-needed'
                ].includes(item.priority)
            ).length;

            // 5. Total active opportunities.
            const activeRes = await fastify.db.query(
                `SELECT COUNT(*)::int AS count
                 FROM opportunities
                 WHERE deleted_at IS NULL
                   AND stage NOT IN ('WON', 'LOST')`
            );

            const activeOpportunities = activeRes.rows[0]?.count || 0;

            // Keep the Dashboard compact while preserving the richer
            // queue data for the dedicated Queue screen.
            const workQueue = queue.slice(0, 5);

            // 6. Prefer the first actionable queue item when available.
            const queueNextAction = workQueue[0] || null;

            // 7. User-specific pending task, used as a fallback
            // when the queue has no actionable opportunities.
            const nextTaskRes = await fastify.db.query(
                `SELECT
                    t.id,
                    t.opportunity_id,
                    t.type,
                    t.title,
                    t.description,
                    t.due_at,
                    t.priority,
                    t.status,
                    o.name AS org_name,
                    opp.name AS opportunity_name,
                    opp.stage
                 FROM tasks t
                 LEFT JOIN opportunities opp
                    ON t.opportunity_id = opp.id
                 LEFT JOIN organisations o
                    ON opp.organisation_id = o.id
                 WHERE t.assigned_to = $1
                   AND t.status = 'pending'
                   AND (
                       opp.id IS NULL
                       OR (
                           opp.deleted_at IS NULL
                           AND opp.stage NOT IN ('WON', 'LOST')
                       )
                   )
                 ORDER BY
                    CASE
                        WHEN t.due_at < NOW() THEN 0
                        WHEN t.due_at::date = CURRENT_DATE THEN 1
                        ELSE 2
                    END,
                    CASE t.priority
                        WHEN 'high' THEN 1
                        WHEN 'medium' THEN 2
                        ELSE 3
                    END,
                    t.due_at ASC
                 LIMIT 1`,
                [userId]
            );

            const taskNextAction = nextTaskRes.rows[0] || null;

            const nextAction = queueNextAction || taskNextAction;

            reply.send({
                user,
                today: {
                    due: dueToday,
                    overdue: overdue,
                    needsAttention: needsAttention,
                    pending: Number(taskSummary.pending || 0),
                    research: Number(taskSummary.research || 0),
                    outreach: Number(taskSummary.outreach || 0),
                    calls: Number(taskSummary.calls || 0),
                    followUps: Number(taskSummary.follow_ups || 0),
                    proposals: Number(taskSummary.proposals || 0)
                },
                pipeline,
                activeOpportunities,
                nextAction,
                workQueue,
                hasData: activeOpportunities > 0 || Number(taskSummary.pending || 0) > 0,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            fastify.log.error(err);
            reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
