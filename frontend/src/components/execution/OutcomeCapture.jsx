export default function OutcomeCapture({
    selectedActionType,
    selectedLabel,
    outcomeOptions,
    actionOutcome,
    actionNote,
    memory,
    nextAction,
    nextActionDue,
    nextActionReason,
    dueChoice,
    showCloseLost,
    submitting,
    NEXT_ACTIONS,
    NEXT_REASONS,
    onOutcomeSelect,
    onActionNoteChange,
    onMemoryChange,
    onNextActionChange,
    onDueChoiceChange,
    onNextActionDueChange,
    onNextActionReasonChange,
    computeDueLocal,
    onCloseLost,
    onKeepOpen,
    onSubmit
}) {
    if (
        !selectedActionType ||
        ['RESEARCH', 'DECISION_MAKER'].includes(selectedActionType)
    ) {
        return null;
    }

    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">
                How did it go?{' '}
                <span className="text-slate-400 font-normal">
                    ({selectedLabel || selectedActionType})
                </span>
            </h3>

            <div className="flex flex-wrap gap-2">
                {outcomeOptions.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onOutcomeSelect(opt)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                            actionOutcome === opt
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            <div>
                <label className="block text-xs text-slate-400 mb-1">
                    Quick note (optional)
                </label>

                <textarea
                    value={actionNote}
                    onChange={e => onActionNoteChange(e.target.value)}
                    rows="2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Anything about this interaction..."
                />
            </div>

            <div>
                <label className="block text-xs text-slate-400 mb-1">
                    What should I remember? (optional)
                </label>

                <textarea
                    value={memory}
                    onChange={e => onMemoryChange(e.target.value)}
                    rows="2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Persistent note for next time..."
                />
            </div>

            <div>
                <label className="block text-xs text-slate-400 mb-1">
                    What's next?
                </label>

                <select
                    value={nextAction}
                    onChange={e => onNextActionChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">— no change —</option>
                    <option value="__CLEAR_NEXT_ACTION__">Clear next action</option>

                    {NEXT_ACTIONS.map(a => (
                        <option key={a} value={a}>
                            {a}
                        </option>
                    ))}
                </select>
            </div>

            {nextAction && (
                <>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">
                            When?
                        </label>

                        <div className="flex flex-wrap gap-2 mb-2">
                            {[
                                {
                                    id: 'today',
                                    label: 'Today'
                                },
                                {
                                    id: 'tomorrow',
                                    label: 'Tomorrow'
                                },
                                {
                                    id: 'this_week',
                                    label: 'This week'
                                },
                                {
                                    id: 'custom',
                                    label: 'Custom'
                                }
                            ].map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        onDueChoiceChange(c.id);

                                        if (c.id !== 'custom') {
                                            onNextActionDueChange(
                                                computeDueLocal(c.id)
                                            );
                                        } else {
                                            onNextActionDueChange('');
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                        dueChoice === c.id
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-700 text-slate-300'
                                    }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>

                        {dueChoice === 'custom' && (
                            <input
                                type="datetime-local"
                                value={nextActionDue}
                                onChange={e =>
                                    onNextActionDueChange(e.target.value)
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">
                            Why? (optional)
                        </label>

                        <select
                            value={nextActionReason}
                            onChange={e =>
                                onNextActionReasonChange(e.target.value)
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">— optional —</option>

                            {NEXT_REASONS.map(r => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {showCloseLost && (
                <div className="bg-red-500/10 border border-red-500/40 p-4 rounded-2xl space-y-3">
                    <p className="text-sm text-red-200">
                        Not interested — close this opportunity as Lost?
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={onCloseLost}
                            disabled={submitting}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl text-sm"
                        >
                            Close as Lost
                        </button>

                        <button
                            onClick={onKeepOpen}
                            className="flex-1 bg-slate-700 text-slate-200 font-semibold py-3 rounded-xl text-sm"
                        >
                            Keep open
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={onSubmit}
                disabled={submitting || !actionOutcome}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-2xl text-lg shadow-lg shadow-emerald-600/30 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? 'Saving...' : 'Save & Continue'}
            </button>
        </div>
    );
}
