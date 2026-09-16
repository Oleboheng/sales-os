export default function IntelligencePanel({
    intelRecommendations,
    primaryIntelRecommendation,
    additionalIntelRecommendations,
    confidenceLabel,
    mapIntelToAction,
    context,
    onActionSelect
}) {
    if (intelRecommendations.length === 0) {
        return null;
    }

    return (
        <div className="bg-slate-800/80 border border-indigo-500/30 p-5 rounded-3xl shadow-xl space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-indigo-400">
                    NEXT BEST ACTION
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                    Ranked from the information currently available.
                </p>
            </div>

            {primaryIntelRecommendation && (
                <div className="bg-slate-950/70 border border-indigo-500/40 p-4 rounded-2xl">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                                Primary
                            </p>

                            <h4 className="text-lg font-semibold text-white mt-1">
                                {primaryIntelRecommendation.label ||
                                    primaryIntelRecommendation.action_label ||
                                    primaryIntelRecommendation.action_type}
                            </h4>
                        </div>

                        {confidenceLabel(
                            primaryIntelRecommendation.confidence
                        ) && (
                            <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-lg bg-slate-700 text-slate-300">
                                {confidenceLabel(
                                    primaryIntelRecommendation.confidence
                                )}{' '}
                                confidence
                            </span>
                        )}
                    </div>

                    {primaryIntelRecommendation.reason && (
                        <p className="text-sm text-slate-300 mt-3">
                            {primaryIntelRecommendation.reason}
                        </p>
                    )}

                    {primaryIntelRecommendation.priority != null && (
                        <p className="text-xs text-slate-500 mt-2">
                            Priority:{' '}
                            {primaryIntelRecommendation.priority}
                        </p>
                    )}

                    {(primaryIntelRecommendation.target_type ||
                        primaryIntelRecommendation.target_label) && (
                        <p className="text-xs text-slate-500 mt-1">
                            {primaryIntelRecommendation.target_type
                                ? primaryIntelRecommendation.target_type
                                : ''}
                            {primaryIntelRecommendation.target_type &&
                            primaryIntelRecommendation.target_label
                                ? ' · '
                                : ''}
                            {primaryIntelRecommendation.target_label ||
                                ''}
                        </p>
                    )}

                    {(() => {
                        const mapped = mapIntelToAction(
                            primaryIntelRecommendation,
                            context
                        );

                        if (!mapped) {
                            return null;
                        }

                        return (
                            <button
                                onClick={() =>
                                    onActionSelect(mapped)
                                }
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-2xl text-lg shadow-lg shadow-indigo-600/30 transition active:scale-[0.98]"
                            >
                                {mapped.label}
                            </button>
                        );
                    })()}
                </div>
            )}

            {additionalIntelRecommendations.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2">
                        ALSO CONSIDER
                    </p>

                    <div className="space-y-2">
                        {additionalIntelRecommendations.map(
                            (rec, index) => {
                                const mapped = mapIntelToAction(
                                    rec,
                                    context
                                );

                                if (!mapped) {
                                    return null;
                                }

                                const confidence =
                                    confidenceLabel(
                                        rec.confidence
                                    );

                                return (
                                    <div
                                        key={`intel-${rec.rank || index}-${rec.action_type}-${rec.target_type || ''}`}
                                        className="bg-slate-900/70 border border-slate-700/70 p-4 rounded-2xl"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">
                                                    {rec.label ||
                                                        rec.action_label ||
                                                        mapped.label}
                                                </p>

                                                {rec.reason && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {rec.reason}
                                                    </p>
                                                )}
                                            </div>

                                            {confidence && (
                                                <span className="shrink-0 text-xs font-medium text-slate-400">
                                                    {confidence}
                                                </span>
                                            )}
                                        </div>

                                        {rec.target_type ||
                                        rec.target_label ? (
                                            <p className="text-xs text-slate-500 mt-2">
                                                {rec.target_type || ''}
                                                {rec.target_type &&
                                                rec.target_label
                                                    ? ' · '
                                                    : ''}
                                                {rec.target_label ||
                                                    ''}
                                            </p>
                                        ) : null}

                                        <button
                                            onClick={() =>
                                                onActionSelect(
                                                    mapped
                                                )
                                            }
                                            className="w-full mt-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-3 rounded-xl text-sm transition active:scale-[0.98]"
                                        >
                                            {mapped.label}
                                        </button>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
