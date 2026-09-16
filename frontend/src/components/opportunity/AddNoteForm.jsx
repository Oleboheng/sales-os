import React from 'react';

export default function AddNoteForm({ noteBody, setNoteBody, onAddNote }) {
    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                Add Note
            </h3>
            <div className="space-y-3">
                <textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                    rows="2"
                />
                <button
                    onClick={onAddNote}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition active:scale-[0.98]"
                >
                    Save Note
                </button>
            </div>
        </div>
    );
}
