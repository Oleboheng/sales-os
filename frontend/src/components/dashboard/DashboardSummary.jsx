import React from 'react';

const metrics = [
    {
        key: 'due',
        label: 'Due today'
    },
    {
        key: 'overdue',
        label: 'Overdue'
    },
    {
        key: 'pending',
        label: 'Pending'
    },
    {
        key: 'activeOpportunities',
        label: 'Active prospects'
    }
];

export default function DashboardSummary({ today, activeOpportunities }) {
    const values = {
        ...today,
        activeOpportunities
    };

    return (
        <section aria-labelledby="dashboard-summary-heading">
            <div className="flex items-center justify-between mb-3">
                <h2
                    id="dashboard-summary-heading"
                    className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500"
                >
                    Today
                </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {metrics.map((metric) => (
                    <div
                        key={metric.key}
                        className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5"
                    >
                        <div className="text-2xl sm:text-3xl font-black text-white">
                            {values[metric.key] ?? 0}
                        </div>

                        <div className="mt-1 text-xs font-medium text-slate-500 truncate">
                            {metric.label}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
