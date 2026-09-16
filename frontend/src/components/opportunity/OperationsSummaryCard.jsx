import React from 'react';

export default function OperationsSummaryCard({ research, isResearchCompleted }) {
    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                Operations
            </h3>
            {research ? (
                <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-xs text-slate-400">Teams</span>
                            <p className="text-white">{research.teams_count || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400">Players (est.)</span>
                            <p className="text-white">{research.players_estimate || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                            <span className="text-xs text-slate-400">Admin Complexity</span>
                            <p className="text-white">{research.admin_complexity || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                            <span className="text-xs text-slate-400">Current System</span>
                            <p className="text-white">{research.current_system || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400">Registration</span>
                            <p className="text-white">{research.registration_method || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400">Communication</span>
                            <p className="text-white">{research.communication_method || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                            <span className="text-xs text-slate-400">Reporting</span>
                            <p className="text-white">{research.reporting_method || 'N/A'}</p>
                        </div>
                    </div>
                    {isResearchCompleted && (
                        <p className="text-xs text-green-400 mt-2">Research completed ✓</p>
                    )}
                </div>
            ) : (
                <p className="text-sm text-slate-400">No research data yet.</p>
            )}
        </div>
    );
}
