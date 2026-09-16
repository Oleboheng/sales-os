import React from 'react';
import { Link } from 'react-router-dom';

export default function DecisionMakerSummaryCard({ decisionMaker, id }) {
    return (
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400"></span>
                Decision Maker
            </h3>
            {decisionMaker.selectedPerson ? (
                <div className="space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-white">
                                {decisionMaker.selectedPerson.first_name} {decisionMaker.selectedPerson.last_name}
                            </p>
                            <p className="text-xs text-slate-400">{decisionMaker.selectedPerson.role || 'No role'}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            {decisionMaker.status}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                        {decisionMaker.selectedPerson.authority_level && (
                            <span className="bg-slate-700 px-2 py-1 rounded-full text-slate-300">
                                Authority: {decisionMaker.selectedPerson.authority_level}
                            </span>
                        )}
                        {decisionMaker.selectedPerson.confidence_level && (
                            <span className="bg-slate-700 px-2 py-1 rounded-full text-slate-300">
                                Confidence: {decisionMaker.selectedPerson.confidence_level}
                            </span>
                        )}
                        {decisionMaker.selectedPerson.preferred_channel && (
                            <span className="bg-slate-700 px-2 py-1 rounded-full text-slate-300">
                                Channel: {decisionMaker.selectedPerson.preferred_channel}
                            </span>
                        )}
                    </div>
                    {decisionMaker.selectedPerson.email && (
                        <p className="text-xs text-slate-400">✉ {decisionMaker.selectedPerson.email}</p>
                    )}
                    {decisionMaker.selectedPerson.phone_primary && (
                        <p className="text-xs text-slate-400">📞 {decisionMaker.selectedPerson.phone_primary}</p>
                    )}
                    {decisionMaker.selectedPerson.intelligence_evidence && (
                        <div className="mt-2 bg-slate-900/50 p-2 rounded-xl text-xs text-slate-300">
                            {decisionMaker.selectedPerson.intelligence_evidence}
                        </div>
                    )}
                </div>
            ) : decisionMaker.status === 'UNCERTAIN' ? (
                <div className="space-y-2">
                    <p className="text-sm text-amber-300">Situation uncertain</p>
                    {decisionMaker.notes && <p className="text-xs text-slate-400">{decisionMaker.notes}</p>}
                    <Link to={`/opportunities/${id}/decision-maker`} className="text-xs text-indigo-400 hover:underline">
                        Review Decision Maker →
                    </Link>
                </div>
            ) : (
                <div>
                    <p className="text-sm text-slate-400">Not identified yet.</p>
                    <Link to={`/opportunities/${id}/decision-maker`} className="text-xs text-indigo-400 hover:underline block mt-2">
                        Identify Decision Maker →
                    </Link>
                </div>
            )}
            <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-400">
                Status: {decisionMaker.status}
            </div>
        </div>
    );
}
