export default function UserNextActionCard({ opportunity }) {
    if (!opportunity.next_action) {
        return null;
    }

    return (
        <div className="bg-slate-800/80 border border-amber-500/30 p-5 rounded-3xl shadow-xl">
            <h3 className="text-sm font-semibold text-amber-400 mb-2">
                YOUR NEXT ACTION
            </h3>

            <p className="text-lg font-semibold text-white">
                {opportunity.next_action}
            </p>

            {opportunity.next_action_due_at && (
                <p className="text-xs text-slate-400 mt-1">
                    Due:{' '}
                    {new Date(
                        opportunity.next_action_due_at
                    ).toLocaleString()}
                </p>
            )}

            {opportunity.next_action_reason && (
                <p className="text-xs text-slate-400 mt-1">
                    {opportunity.next_action_reason}
                </p>
            )}

            <p className="text-xs text-amber-300/70 mt-3">
                This is your existing next-action commitment.
                Intelligence does not overwrite it.
            </p>
        </div>
    );
}
