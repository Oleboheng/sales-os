import React from 'react';
import { Link } from 'react-router-dom';

export default function OpportunityHeader({
    organisation,
    opportunity,
    scoring,
    id,
    newStage,
    onNewStageChange,
    onStageApply
}) {
    return (
        <header className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                    <Link to="/organisations" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5 mb-1">
                        ← Back to Organisations
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">{organisation.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-sm text-slate-300">
                            {organisation.city}, {organisation.province}
                        </span>
                        {organisation.industry && (
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300">
                                {organisation.industry}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/opportunities/${id}/decision-maker`} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold transition">
                        Decision Maker
                    </Link>
                    {opportunity.stage !== 'WON' && opportunity.stage !== 'LOST' && (
                        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 p-2 rounded-2xl">
                            <select
                                value={newStage}
                                onChange={(e) => onNewStageChange(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Move stage...</option>
                                <option value="researched">Researched</option>
                                <option value="permission_requested">Permission Requested</option>
                                <option value="permission_received">Permission Received</option>
                                <option value="discovery">Discovery</option>
                                <option value="demonstration">Demonstration</option>
                                <option value="proposal">Proposal</option>
                                <option value="decision">Decision</option>
                                <option value="won">Won</option>
                                <option value="lost">Lost</option>
                                <option value="nurture">Nurture</option>
                            </select>
                            <button
                                onClick={onStageApply}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition active:scale-[0.98]"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-700/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Score:</span>
                {scoring ? (
                    <>
                        <span className="text-xl font-bold text-white">{scoring.totalScore}</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            scoring.band === 'VERY_HIGH' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            scoring.band === 'HIGH' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                            scoring.band === 'GOOD' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            scoring.band === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {scoring.band}
                        </span>
                    </>
                ) : (
                    <span className="text-slate-400">—</span>
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-2">Qualification:</span>
                {scoring ? (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        scoring.qualification.status === 'QUALIFIED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                        {scoring.qualification.status}
                    </span>
                ) : (
                    <span className="text-slate-400">—</span>
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-2">Stage:</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    {opportunity.stage_name || opportunity.stage}
                </span>
                {opportunity.campaign && (
                    <span className="text-xs text-slate-400">Campaign: {opportunity.campaign}</span>
                )}
                {opportunity.source && (
                    <span className="text-xs text-slate-400">Source: {opportunity.source}</span>
                )}
            </div>
        </header>
    );
}
