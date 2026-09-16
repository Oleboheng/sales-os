export default function AvailableActions({
    actions,
    selectedActionType,
    selectedLabel,
    onActionSelect
}) {
    if (actions.length === 0) {
        return null;
    }

    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">
                Available now
            </h3>

            <div className="flex flex-wrap gap-2">
                {actions.map(action => (
                    <button
                        key={`${action.type}-${action.target_type || ''}-${action.target || ''}`}
                        onClick={() => onActionSelect(action)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                            selectedActionType === action.type &&
                            selectedLabel === action.label
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            <p className="text-xs text-slate-500 mt-3">
                Available channels show what can be executed now.
                They are separate from the intelligence ranking.
            </p>
        </div>
    );
}
