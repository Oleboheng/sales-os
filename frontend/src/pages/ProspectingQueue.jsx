import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ProspectingQueue() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    const fetchQueue = async (filterVal) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/api/prospecting/queue?filter=${filterVal}`);
            setItems(res.data);
        } catch (err) {
            setError('Failed to load queue.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue(filter);
    }, [filter]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    const renderScore = (item) => {
        const score = item.fit_score || 0;
        const band = item.score_band || 'LOW';
        const color = {
            VERY_HIGH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            HIGH: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
            GOOD: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            MODERATE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            LOW: 'bg-red-500/20 text-red-400 border-red-500/30'
        }[band] || 'bg-slate-700 text-slate-300';

        return (
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{score}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
                    {band}
                </span>
            </div>
        );
    };

    const renderQualification = (item) => {
        const status = item.qualification?.status || 'NOT_READY';
        const color = status === 'QUALIFIED' ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        return (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
                {status}
            </span>
        );
    };

    const renderPriorityReason = (item) => {
        if (!item.priority_reason) return null;
        const icon = item.priority === 'overdue' ? '⚠️' : '●';
        return (
            <span className="text-xs text-slate-400 flex items-center gap-1">
                <span className="text-amber-400">{icon}</span> {item.priority_reason}
            </span>
        );
    };

    // Summary counts
    const total = items.length;
    const overdue = items.filter(i => i.priority === 'overdue').length;
    const dueToday = items.filter(i => i.priority === 'due-today').length;
    const researchNeeded = items.filter(i => i.priority === 'research-needed').length;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></span>
                    <p className="text-slate-400 font-medium">Loading queue...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
                <div className="bg-slate-800/80 border border-red-500/50 p-6 rounded-3xl text-center max-w-md">
                    <p className="text-red-300">{error}</p>
                    <button onClick={() => fetchQueue(filter)} className="mt-4 text-indigo-400 hover:underline text-sm">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-6 selection:bg-indigo-500 selection:text-white">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">Prospecting Queue</h1>
                    <Link to="/" className="text-sm text-slate-400 hover:text-white transition">← Dashboard</Link>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-white">{total}</div>
                        <div className="text-xs text-slate-400">Need attention</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-amber-400">{overdue}</div>
                        <div className="text-xs text-slate-400">Overdue</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-indigo-400">{dueToday}</div>
                        <div className="text-xs text-slate-400">Due today</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-cyan-400">{researchNeeded}</div>
                        <div className="text-xs text-slate-400">Research needed</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {['all', 'today', 'overdue', 'research', 'follow-up'].map(f => (
                        <button
                            key={f}
                            onClick={() => handleFilterChange(f)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                                filter === f
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {f === 'all' ? 'All' :
                             f === 'today' ? 'Today' :
                             f === 'overdue' ? 'Overdue' :
                             f === 'research' ? 'Research' :
                             'Follow-up'}
                        </button>
                    ))}
                </div>

                {/* Queue items */}
                <div className="space-y-4">
                    {items.length === 0 ? (
                        <div className="bg-slate-800/80 border border-slate-700/80 p-8 rounded-3xl text-center text-slate-400">
                            <p className="text-lg font-semibold text-white">You're clear.</p>
                            <p>No prospects currently need attention.</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md hover:border-slate-600 transition">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-white truncate">{item.org_name || item.name}</h3>
                                                <p className="text-sm text-slate-400">{item.city}, {item.province}</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2">
                                                {renderScore(item)}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                                            <span className="text-xs text-slate-400">Stage:</span>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                                                {item.stage}
                                            </span>
                                            {renderQualification(item)}
                                            <span className="text-xs text-slate-400">DM: {item.decision_maker_status?.toLowerCase().replace('_', ' ')}</span>
                                        </div>
                                        {item.next_action && (
                                            <div className="mt-2 text-sm">
                                                <span className="text-slate-400">Next:</span>
                                                <span className="text-white ml-1">{item.next_action}</span>
                                                {item.due_at && (
                                                    <span className="text-xs text-slate-500 ml-2">
                                                        Due: {new Date(item.due_at).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {renderPriorityReason(item)}
                                    </div>
                                    <button
                                        onClick={() => navigate(`/execute/${item.id}`)}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition active:scale-[0.98] whitespace-nowrap"
                                    >
                                        WORK →
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
