import React from 'react';

export default function AddTaskForm({ newTask, setNewTask, onAddTask }) {
    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Add Task
            </h3>
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <input
                    type="datetime-local"
                    value={newTask.due_at}
                    onChange={(e) => setNewTask({...newTask, due_at: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <button
                    onClick={onAddTask}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition active:scale-[0.98]"
                >
                    Create Task
                </button>
            </div>
        </div>
    );
}
