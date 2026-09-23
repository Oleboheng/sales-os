import React from 'react';
import { Link } from 'react-router-dom';

const priorityLabels = {
    overdue: 'Overdue',
    today: 'Due today',
    'active-followup': 'Follow-up',
    'qualified-ready': 'Qualified',
    'research-needed': 'Research',
    low: 'Low priority'
};

function getPriorityLabel(item) {
    return priorityLabels[item.priority] || 'Open';
}

function getActionLabel(item) {
    if (item.priority === 'overdue') return 'Work now';
    if (item.research_completed === false) return 'Research';
    if (item.decision_maker_status === 'NOT_IDENTIFIED') return 'Identify';
    return 'Open';
}

export default function WorkQueue({ items }) {
    const visibleItems = Array.isArray(items) ? items.slice(0, 5) : [];

    return (
        <section className="min-w-0 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-base font-bold text-white">
                        Your work queue
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Prioritized from your current sales pipeline
                    </p>
                </div>

                <Link
                    to="/queue"
                    className="shrink-0 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                    View all →
                </Link>
            </div>

            {visibleItems.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-800 px-4 py-8 text-center">
                    <p className="text-sm font-medium text-slate-400">
                        Nothing needs your attention yet.
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                        New prospects will appear here automatically.
                    </p>
                </div>
            ) : (
                <div className="mt-5 divide-y divide-slate-800">
                    {visibleItems.map((item) => {
                        const opportunityId = item.id;

                        return (
                            <div
                                key={item.id}
                                className="flex min-w-0 items-center gap-3 py-4 first:pt-0 last:pb-0"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span
                                            className={`h-2 w-2 shrink-0 rounded-full ${
                                                item.priority === 'overdue'
                                                    ? 'bg-rose-400'
                                                    : item.priority === 'today'
                                                        ? 'bg-amber-400'
                                                        : 'bg-indigo-400'
                                            }`}
                                        />

                                        <p
                                            className="min-w-0 truncate text-sm font-semibold text-white"
                                            title={item.org_name || item.name}
                                        >
                                            {item.org_name || item.name}
                                        </p>
                                    </div>

                                    <div className="mt-1 flex min-w-0 items-center gap-2 pl-4">
                                        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                            {getPriorityLabel(item)}
                                        </span>

                                        {item.sales_hypothesis && (
                                            <span
                                                className="min-w-0 truncate text-xs text-slate-500"
                                                title={item.sales_hypothesis}
                                            >
                                                {item.sales_hypothesis}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Link
                                    to={`/opportunities/${opportunityId}`}
                                    className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                                >
                                    {getActionLabel(item)}
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
