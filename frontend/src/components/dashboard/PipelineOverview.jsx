import React from 'react';
import { Link } from 'react-router-dom';

const stageLabels = {
    TARGETING: 'Targeting',
    RESEARCH: 'Research',
    DISCOVERY: 'Discovery',
    QUALIFIED: 'Qualified',
    PROPOSAL: 'Proposal',
    NEGOTIATION: 'Negotiation'
};

export default function PipelineOverview({ pipeline }) {
    const entries = Object.entries(pipeline || {});

    return (
        <section className="min-w-0 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-bold text-white">
                        Pipeline
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Active opportunities by stage
                    </p>
                </div>

                <Link
                    to="/queue"
                    className="shrink-0 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                    View queue →
                </Link>
            </div>

            {entries.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-center">
                    <p className="text-sm text-slate-500">
                        Your pipeline is empty.
                    </p>
                </div>
            ) : (
                <div className="mt-5 space-y-3">
                    {entries.map(([stage, count]) => (
                        <div
                            key={stage}
                            className="flex min-w-0 items-center justify-between gap-4"
                        >
                            <div className="min-w-0 flex items-center gap-3">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-400" />

                                <span className="truncate text-sm font-medium text-slate-300">
                                    {stageLabels[stage] || stage.replace(/_/g, ' ')}
                                </span>
                            </div>

                            <span className="shrink-0 text-sm font-bold text-white">
                                {count}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
