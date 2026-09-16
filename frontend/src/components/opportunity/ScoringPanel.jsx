import React from 'react';

export default function ScoringPanel({ scoring }) {
    const body = (() => {
        if (!scoring) return <p className="text-slate-400 text-sm">No scoring data available.</p>;
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-white">{scoring.totalScore}</span>
                    <span className={`text-sm font-bold px-4 py-1 rounded-full ${
                        scoring.band === 'VERY_HIGH' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        scoring.band === 'HIGH' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                        scoring.band === 'GOOD' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        scoring.band === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                        {scoring.band}
                    </span>
                </div>
                <div className="space-y-1">
                    {Object.entries(scoring.breakdown).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                            <span className="w-28 text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(val.score / val.max) * 100}%` }}></div>
                            </div>
                            <span className="w-8 text-right text-white">{val.score}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/60">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-white">Qualification</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            scoring.qualification.status === 'QUALIFIED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                            {scoring.qualification.status}
                        </span>
                    </div>
                    {scoring.qualification.status === 'NOT_READY' && (
                        <ul className="mt-2 text-xs text-amber-300 list-disc list-inside">
                            {scoring.qualification.missing.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                    )}
                    {scoring.qualification.status === 'QUALIFIED' && (
                        <ul className="mt-2 text-xs text-green-300 list-disc list-inside">
                            <li>All qualification gates satisfied ✓</li>
                        </ul>
                    )}
                </div>
            </div>
        );
    })();

    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Scoring & Qualification
            </h3>
            {body}
        </div>
    );
}
