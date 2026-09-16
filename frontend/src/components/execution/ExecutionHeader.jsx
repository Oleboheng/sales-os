export default function ExecutionHeader({
    organisation,
    opportunity,
    scoring,
    decisionMaker,
    researchState,
    contact,
    onBack
}) {
    return (
        <>
            <div className="flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="text-slate-400 hover:text-white text-sm"
                >
                    ← Queue
                </button>

                <span className="text-xs text-slate-500">
                    Execution
                </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl">
                <h1 className="text-2xl font-bold text-white">
                    {organisation.name}
                </h1>

                <p className="text-sm text-slate-400">
                    {organisation.city}, {organisation.province}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {opportunity.stage}
                    </span>

                    {scoring && (
                        <>
                            <span className="text-sm font-bold text-white">
                                {scoring.totalScore}
                            </span>

                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {scoring.band}
                            </span>
                        </>
                    )}

                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        DM: {decisionMaker.status}
                    </span>

                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        Research: {researchState}
                    </span>
                </div>

                {contact && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <p className="text-sm font-semibold text-white">
                            {contact.first_name} {contact.last_name}
                        </p>

                        <p className="text-xs text-slate-400">
                            {contact.role}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
