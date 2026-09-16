import React from 'react';

export default function ActivitiesList({ recentActivities }) {
    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    Activities
                </h3>
                <span className="text-xs font-semibold bg-slate-900 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">
                    {recentActivities?.length || 0}
                </span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {recentActivities && recentActivities.length > 0 ? (
                    recentActivities.map(act => (
                        <div key={act.id} className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-sm space-y-1 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-indigo-400 capitalize text-xs bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">{act.type}</span>
                                <span className="text-[10px] text-slate-500">{new Date(act.completed_at).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-200 text-xs mt-1">{act.subject}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No recent activities.</p>
                )}
            </div>
        </div>
    );
}
