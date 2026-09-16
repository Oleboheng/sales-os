import React from 'react';

export default function WhyThisProspectCard({ opportunity }) {
    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Why This Prospect
            </h3>
            {opportunity.sales_hypothesis ? (
                <p className="text-sm text-slate-300">{opportunity.sales_hypothesis}</p>
            ) : (
                <p className="text-sm text-slate-400">No sales hypothesis yet.</p>
            )}
            {opportunity.problem_identified && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-400">Problem:</p>
                    <p className="text-sm text-slate-300">{opportunity.problem_identified}</p>
                </div>
            )}
            {opportunity.impact && (
                <div className="mt-2">
                    <p className="text-xs font-semibold text-slate-400">Impact:</p>
                    <p className="text-sm text-slate-300">{opportunity.impact}</p>
                </div>
            )}
        </div>
    );
}
