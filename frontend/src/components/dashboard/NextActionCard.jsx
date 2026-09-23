import React from 'react';
import { Link } from 'react-router-dom';

function formatDueDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getActionLabel(action) {
    if (action?.priority === 'high') return 'High priority';

    if (action?.priority === 'medium') return 'Recommended next';

    return 'Next action';
}

function getDescription(action) {
    if (!action) return '';

    if (action.priority_reason) {
        return action.priority_reason;
    }

    if (action.priority === 'overdue') {
        return 'This prospect requires attention before lower-priority work.';
    }

    if (action.research_completed === false) {
        return 'Research is still required before moving this prospect forward.';
    }

    if (action.decision_maker_status === 'NOT_IDENTIFIED') {
        return 'The decision maker has not been identified yet.';
    }

    if (action.next_action) {
        return action.next_action;
    }

    return 'Review this prospect and complete the next available action.';
}

export default function NextActionCard({ action }) {
    if (!action) return null;

    const opportunityId = action.opportunity_id || action.id;
    const organisationName = action.org_name || action.name || 'Organisation';
    const opportunityName = action.opportunity_name || action.name || 'Opportunity';
    const dueDate = formatDueDate(action.due_at);

    return (
        <section
            aria-labelledby="next-action-heading"
            className="overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-slate-900 to-slate-900 shadow-xl"
        >
            <div className="border-l-4 border-indigo-500 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <span className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                            {getActionLabel(action)}
                        </span>

                        <h2
                            id="next-action-heading"
                            className="mt-4 truncate text-xl font-bold text-white"
                            title={organisationName}
                        >
                            {organisationName}
                        </h2>

                        <p
                            className="mt-1 truncate text-sm font-medium text-slate-300"
                            title={opportunityName}
                        >
                            {opportunityName}
                        </p>
                    </div>

                    {dueDate && (
                        <div className="shrink-0 text-left sm:text-right">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Due
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-300">
                                {dueDate}
                            </p>
                        </div>
                    )}
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                    {getDescription(action)}
                </p>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    {opportunityId && (
                        <Link
                            to={`/opportunities/${opportunityId}`}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
                        >
                            Open opportunity
                            <span className="ml-2">→</span>
                        </Link>
                    )}

                    <Link
                        to="/queue"
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 px-5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                    >
                        View queue
                    </Link>
                </div>
            </div>
        </section>
    );
}
