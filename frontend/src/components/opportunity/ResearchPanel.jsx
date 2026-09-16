import React from 'react';

export default function ResearchPanel({
    research,
    opportunityType,
    researchForm,
    isResearchCompleted,
    progress,
    researchLoading,
    researchErrors,
    saving,
    completing,
    onResearchChange,
    onSaveResearch,
    onCompleteResearch
}) {
    const isWebsiteResearch = opportunityType === 'WEBSITE';

    if (opportunityType !== 'SPORTS_MANAGEMENT' && !isWebsiteResearch) {
        return (
            <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        Research
                    </h3>
                    <span className="text-xs font-semibold bg-slate-900 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">
                        Not implemented
                    </span>
                </div>
                <p className="text-sm text-slate-400">
                    Research for {opportunityType || 'this opportunity type'} is not implemented yet.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Research
                </h3>
                {isResearchCompleted ? (
                    <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                        Completed
                    </span>
                ) : (
                    <span className="text-xs font-semibold bg-slate-900 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">
                        {progress}%
                    </span>
                )}
            </div>
            {researchLoading ? (
                <div className="py-4 text-center text-slate-400">Loading...</div>
            ) : isResearchCompleted ? (
                <div className="space-y-2 text-sm text-slate-300">
                    {isWebsiteResearch ? (
                        <>
                            <p><span className="text-slate-400">Website status:</span> {research?.website_status || 'N/A'}</p>
                            <p><span className="text-slate-400">Website URL:</span> {research?.website_url || 'N/A'}</p>
                            <p><span className="text-slate-400">Digital presence:</span> {research?.digital_presence || 'N/A'}</p>
                            <p><span className="text-slate-400">Problem / opportunity:</span> {research?.problem_opportunity || 'N/A'}</p>
                            <p><span className="text-slate-400">Potential improvements:</span> {research?.potential_improvements || 'N/A'}</p>
                        </>
                    ) : (
                        <>
                            <p><span className="text-slate-400">Website reviewed:</span> {research?.website_reviewed ? '✅' : '❌'}</p>
                            <p><span className="text-slate-400">Social reviewed:</span> {research?.social_reviewed ? '✅' : '❌'}</p>
                            <p><span className="text-slate-400">Teams:</span> {research?.teams_count || 'N/A'}</p>
                            <p><span className="text-slate-400">Admin complexity:</span> {research?.admin_complexity || 'N/A'}</p>
                        </>
                    )}
                    <p><span className="text-slate-400">Hypothesis:</span> {research?.sales_hypothesis || 'N/A'}</p>
                    <p className="text-xs text-slate-500">Completed at: {research?.completed_at ? new Date(research.completed_at).toLocaleString() : 'N/A'}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {researchErrors.length > 0 && (
                        <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-sm text-red-300 space-y-1">
                            {researchErrors.map((err, idx) => <p key={idx}>• {err}</p>)}
                        </div>
                    )}
                    {isWebsiteResearch ? (
                        <div className="bg-slate-900/50 p-4 rounded-xl space-y-3">
                            <h4 className="font-semibold text-sm text-indigo-300">Website Research</h4>
                            <div>
                                <label className="block text-xs text-slate-400">Website status</label>
                                <select value={researchForm.website_status} onChange={(e) => onResearchChange('website_status', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="">Select...</option>
                                    <option value="NONE">No website</option>
                                    <option value="EXISTS">Exists</option>
                                    <option value="OUTDATED">Outdated</option>
                                    <option value="BROKEN">Broken</option>
                                    <option value="UNKNOWN">Unknown</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400">Website URL</label>
                                <input type="url" value={researchForm.website_url} onChange={(e) => onResearchChange('website_url', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="https://example.com" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400">Digital presence</label>
                                <textarea value={researchForm.digital_presence} onChange={(e) => onResearchChange('digital_presence', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" rows="2" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400">Problem / opportunity</label>
                                <textarea value={researchForm.problem_opportunity} onChange={(e) => onResearchChange('problem_opportunity', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" rows="2" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400">Potential improvements</label>
                                <textarea value={researchForm.potential_improvements} onChange={(e) => onResearchChange('potential_improvements', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" rows="2" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400">Sales hypothesis</label>
                                <textarea value={researchForm.sales_hypothesis} onChange={(e) => onResearchChange('sales_hypothesis', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" rows="2" />
                            </div>
                        </div>
                    ) : (
                    <>
                    <div className="bg-slate-900/50 p-4 rounded-xl">
                        <h4 className="font-semibold text-sm text-indigo-300 mb-2">Digital Presence</h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={researchForm.website_reviewed}
                                    onChange={(e) => onResearchChange('website_reviewed', e.target.checked)}
                                    className="w-4 h-4 accent-indigo-500"
                                />
                                Website reviewed
                            </label>
                            <div>
                                <select
                                    value={researchForm.website_quality}
                                    onChange={(e) => onResearchChange('website_quality', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Quality...</option>
                                    <option value="Excellent">Excellent</option>
                                    <option value="Good">Good</option>
                                    <option value="Average">Average</option>
                                    <option value="Poor">Poor</option>
                                    <option value="None">None</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={researchForm.social_reviewed}
                                    onChange={(e) => onResearchChange('social_reviewed', e.target.checked)}
                                    className="w-4 h-4 accent-indigo-500"
                                />
                                Social reviewed
                            </label>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl">
                        <h4 className="font-semibold text-sm text-indigo-300 mb-2">Operations</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-slate-400">Teams</label>
                                <input
                                    type="number"
                                    value={researchForm.teams_count}
                                    onChange={(e) => onResearchChange('teams_count', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="e.g. 8"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400">Players (est.)</label>
                                <input
                                    type="number"
                                    value={researchForm.players_estimate}
                                    onChange={(e) => onResearchChange('players_estimate', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="e.g. 180"
                                />
                            </div>
                        </div>
                        <div className="mt-2">
                            <label className="block text-xs text-slate-400">Admin Complexity</label>
                            <select
                                value={researchForm.admin_complexity}
                                onChange={(e) => onResearchChange('admin_complexity', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Select...</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                                <label className="block text-xs text-slate-400">Registration</label>
                                <input
                                    type="text"
                                    value={researchForm.registration_method}
                                    onChange={(e) => onResearchChange('registration_method', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="WhatsApp, Paper, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400">Communication</label>
                                <input
                                    type="text"
                                    value={researchForm.communication_method}
                                    onChange={(e) => onResearchChange('communication_method', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="WhatsApp, Email, etc."
                                />
                            </div>
                        </div>
                        <div className="mt-2">
                            <label className="block text-xs text-slate-400">Current System</label>
                            <input
                                type="text"
                                value={researchForm.current_system}
                                onChange={(e) => onResearchChange('current_system', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Excel, WhatsApp, etc."
                            />
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl">
                        <h4 className="font-semibold text-sm text-indigo-300 mb-2">Sales Hypothesis</h4>
                        <textarea
                            value={researchForm.sales_hypothesis}
                            onChange={(e) => onResearchChange('sales_hypothesis', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                            rows="2"
                            placeholder="e.g. They manage player info across WhatsApp and Excel, opportunity to centralise admin..."
                        />
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl">
                        <h4 className="font-semibold text-sm text-indigo-300 mb-2">Research Notes</h4>
                        <textarea
                            value={researchForm.notes}
                            onChange={(e) => onResearchChange('notes', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                            rows="2"
                            placeholder="Additional context..."
                        />
                    </div>
                    </>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                            onClick={onSaveResearch}
                            disabled={saving}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl text-sm transition active:scale-[0.98] disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Research'}
                        </button>
                        <button
                            onClick={onCompleteResearch}
                            disabled={completing}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition active:scale-[0.98] disabled:opacity-50"
                        >
                            {completing ? 'Completing...' : 'Complete Research'}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center">
                        Complete Research will move opportunity to RESEARCHED stage.
                    </p>
                </div>
            )}
        </div>
    );
}
