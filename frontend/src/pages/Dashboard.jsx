// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/dashboard/today')
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-slate-900 text-slate-400 flex items-center justify-center font-medium">
            Loading dashboard analytics...
        </div>
    );

    const { today, nextAction, pipeline } = data;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-10 selection:bg-indigo-500 selection:text-white">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header Navigation & Quick Links Bar */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/50 border border-slate-700/60 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Good morning</h1>
                        <p className="text-slate-400 text-sm mt-1">Here is your operational overview for today.</p>
                    </div>
                    
                    {/* Quick navigation links to test your routes */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link to="/" className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2.5 rounded-xl transition">
                            Dashboard
                        </Link>
                        <Link to="/organisations" className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl border border-slate-700 transition shadow-sm">
                            Organisations →
                        </Link>
                    </div>
                </header>

                {/* Today's Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl text-center shadow-lg hover:border-blue-500/50 transition">
                        <div className="text-3xl font-black text-blue-400">{today.research}</div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">Research</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl text-center shadow-lg hover:border-emerald-500/50 transition">
                        <div className="text-3xl font-black text-emerald-400">{today.outreach}</div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">Outreach</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl text-center shadow-lg hover:border-amber-500/50 transition">
                        <div className="text-3xl font-black text-amber-400">{today.calls}</div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">Calls</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl text-center shadow-lg hover:border-purple-500/50 transition">
                        <div className="text-3xl font-black text-purple-400">{today.followUps}</div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">Follow-ups</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl text-center shadow-lg hover:border-rose-500/50 transition col-span-2 md:col-span-1">
                        <div className="text-3xl font-black text-rose-400">{today.proposals}</div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">Proposals</div>
                    </div>
                </div>

                {/* Next Best Action Card */}
                {nextAction && (
                    <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border border-slate-700/80 border-l-4 border-l-indigo-500 p-6 rounded-3xl shadow-xl space-y-3 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Next Best Action</span>
                            <span className="text-xs text-slate-400">Due: {new Date(nextAction.due_at).toLocaleString()}</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{nextAction.title}</h2>
                            <p className="text-sm text-slate-400 mt-0.5">
                                {nextAction.org_name} <span className="text-slate-600">•</span> {nextAction.opportunity_name || 'No opportunity'}
                                {nextAction.stage && ` (${nextAction.stage})`}
                            </p>
                        </div>
                        <div>
                            <Link
                                to={`/opportunities/${nextAction.opportunity_id}`}
                                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition"
                            >
                                View Opportunity →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Pipeline Summary Card */}
                <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
                    <h2 className="font-bold text-white text-base">Pipeline Overview</h2>
                    <div className="flex flex-wrap gap-2.5">
                        {Object.entries(pipeline).map(([stage, count]) => (
                            <div key={stage} className="bg-slate-900 border border-slate-700/60 px-4 py-2 rounded-2xl flex items-center gap-3">
                                <span className="text-xs uppercase font-medium text-slate-400">{stage}</span>
                                <span className="text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}