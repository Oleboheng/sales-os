import React from 'react';

export default function NotesList({ recentNotes }) {
    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    Notes
                </h3>
                <span className="text-xs font-semibold bg-slate-900 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">
                    {recentNotes?.length || 0}
                </span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {recentNotes && recentNotes.length > 0 ? (
                    recentNotes.map(n => (
                        <div key={n.id} className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-sm space-y-1.5 shadow-sm hover:border-slate-700 transition">
                            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                            <span className="text-[10px] text-slate-500 block font-medium">
                                {new Date(n.created_at).toLocaleString()}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No notes yet.</p>
                )}
            </div>
        </div>
    );
}
