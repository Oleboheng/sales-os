import React from 'react';

/**
 * Presentational: opportunity next action or earliest pending task.
 * Props mirror exactly what OpportunityDetail previously read for this section.
 */
export default function NextActionCard({ nextTask, opportunity }) {
    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Next Action
            </h3>
            {nextTask ? (
                <div>
                    <p className="text-sm font-semibold text-white">{nextTask.title}</p>
                    {nextTask.due_at && (
                        <p className="text-xs text-slate-400 mt-1">Due: {new Date(nextTask.due_at).toLocaleString()}</p>
                    )}
                </div>
            ) : opportunity?.next_action ? (
                <div>
                    <p className="text-sm font-semibold text-white">{opportunity.next_action}</p>
                    {opportunity.next_action_due_at && (
                        <p className="text-xs text-slate-400 mt-1">Due: {new Date(opportunity.next_action_due_at).toLocaleString()}</p>
                    )}
                    {opportunity.next_action_reason && (
                        <p className="text-xs text-slate-400 mt-1">{opportunity.next_action_reason}</p>
                    )}
                </div>
            ) : (
                <p className="text-sm text-slate-400">No next action defined.</p>
            )}
        </div>
    );
}
