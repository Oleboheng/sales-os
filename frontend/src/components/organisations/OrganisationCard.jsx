import React from 'react';

export default function OrganisationCard({
    org,
    onOpen,
    onAddOpportunity,
    onAddContact
}) {
    return (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-lg hover:border-slate-600 transition duration-200">
            <div className="flex flex-col gap-4">
                <button
                    type="button"
                    onClick={onOpen}
                    className="min-w-0 w-full text-left group"
                >
                    <div className="min-w-0 space-y-1">
                        <h3
                            title={org.name}
                            className="block min-w-0 truncate text-lg font-bold text-white tracking-wide group-hover:text-indigo-400 transition"
                        >
                            {org.name}
                        </h3>

                        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="shrink-0 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/60">
                                📍 {org.province}
                            </span>

                            {org.website && (
                                <span
                                    title={org.website}
                                    className="min-w-0 max-w-full truncate text-indigo-400"
                                >
                                    🔗 {org.website}
                                </span>
                            )}
                        </div>
                    </div>
                </button>

                <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                        type="button"
                        onClick={onAddOpportunity}
                        className="min-w-0 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-3 py-2.5 rounded-xl text-xs font-semibold transition shadow-sm"
                    >
                        + Opportunity
                    </button>

                    <button
                        type="button"
                        onClick={onAddContact}
                        className="min-w-0 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 px-3 py-2.5 rounded-xl text-xs font-semibold transition shadow-sm"
                    >
                        + Contact
                    </button>
                </div>
            </div>
        </div>
    );
}
