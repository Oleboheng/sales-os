import React from 'react';
import { Link } from 'react-router-dom';

export default function DecisionMakerPanel({
    id,
    organisation,
    people,
    dmStatus,
    setDmStatus,
    dmPersonId,
    setDmPersonId,
    dmSaving,
    dmMessage,
    onSave
}) {
    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-400"></span>
                    Decision Maker
                </h3>
                <Link to={`/opportunities/${id}/decision-maker`} className="text-xs text-indigo-400 hover:underline">
                    Full details →
                </Link>
            </div>
            <p className="text-xs text-slate-400">
                Authoritative for this opportunity. Execution uses this relationship only.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
                {['IDENTIFIED', 'UNCERTAIN', 'NOT_IDENTIFIED'].map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="dmStatusInline"
                            checked={dmStatus === s}
                            onChange={() => {
                                setDmStatus(s);
                                if (s === 'NOT_IDENTIFIED') setDmPersonId('');
                            }}
                            className="w-4 h-4 accent-indigo-500"
                        />
                        {s === 'IDENTIFIED' ? 'Identified' : s === 'UNCERTAIN' ? 'Uncertain' : 'Not identified'}
                    </label>
                ))}
            </div>
            {dmStatus !== 'NOT_IDENTIFIED' && (
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Person</label>
                    {people && people.length > 0 ? (
                        <select
                            value={dmPersonId}
                            onChange={(e) => setDmPersonId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">— Select person —</option>
                            {people.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.first_name} {p.last_name}{p.role ? ` — ${p.role}` : ''}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-xs text-amber-300">
                            No people on this organisation yet.{' '}
                            <Link to={`/organisations/${organisation.id}`} className="text-indigo-400 hover:underline">
                                Add a contact first →
                            </Link>
                        </p>
                    )}
                </div>
            )}
            {dmMessage && (
                <p className={`text-xs ${String(dmMessage).includes('saved') ? 'text-emerald-400' : 'text-red-300'}`}>
                    {dmMessage}
                </p>
            )}
            <button
                type="button"
                onClick={onSave}
                disabled={dmSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-50"
            >
                {dmSaving ? 'Saving...' : 'Save Decision Maker'}
            </button>
        </div>
    );
}
