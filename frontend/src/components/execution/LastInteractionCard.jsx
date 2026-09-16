export default function LastInteractionCard({ last, latest_note }) {
    if (!last) {
        return null;
    }

    return (
        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl text-sm">
            <p className="text-xs font-semibold text-slate-400 mb-1">
                LAST INTERACTION
            </p>

            <p className="text-white font-medium">
                {last.subject || last.type}
            </p>

            <p className="text-slate-300 text-xs mt-0.5">
                {last.outcome}
                {last.days_ago != null
                    ? ` · ${
                          last.days_ago === 0
                              ? 'Today'
                              : last.days_ago + ' day(s) ago'
                      }`
                    : ''}
            </p>

            {last.content &&
                last.content !== last.outcome && (
                    <p className="text-slate-400 text-xs mt-1 italic">
                        "{last.content}"
                    </p>
                )}

            {latest_note && (
                <p className="text-slate-400 text-xs mt-2 border-t border-slate-700/50 pt-2">
                    Remember: {latest_note.body}
                </p>
            )}
        </div>
    );
}
