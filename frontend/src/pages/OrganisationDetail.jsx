import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function OrganisationDetail() {
    const { id } = useParams();
    const [org, setOrg] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [opportunities, setOpportunities] = useState([]);

    useEffect(() => {
        api.get(`/api/organisations/${id}`)
            .then(res => setOrg(res.data))
            .catch(console.error);
        api.get(`/api/organisations/${id}/contacts`)
            .then(res => setContacts(res.data))
            .catch(console.error);
        api.get(`/api/organisations/${id}/opportunities`)
            .then(res => setOpportunities(res.data))
            .catch(console.error);
    }, [id]);

    if (!org) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans">
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></span>
                    <p className="text-slate-400 font-medium">Loading organisation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-10 selection:bg-indigo-500 selection:text-white">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header */}
                <header className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
                    <Link to="/organisations" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5 mb-2">
                        ← Back to Organisations
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">{org.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        <span className="text-slate-400">Province: <span className="text-white">{org.province}</span></span>
                        {org.website && (
                            <span className="text-indigo-400">
                                <a href={org.website} target="_blank" rel="noreferrer" className="hover:underline">{org.website}</a>
                            </span>
                        )}
                        {org.phone && <span className="text-slate-300">📞 {org.phone}</span>}
                    </div>
                    {org.notes && (
                        <p className="text-sm text-slate-400 bg-slate-900/50 p-3 rounded-xl mt-3">{org.notes}</p>
                    )}
                </header>

                {/* Grid: Contacts & Opportunities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Contacts Panel */}
                    <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl backdrop-blur-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                Contacts
                            </h3>
                            <span className="text-xs font-semibold bg-slate-900 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">
                                {contacts.length}
                            </span>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {contacts.length === 0 ? (
                                <p className="text-xs text-slate-500 italic py-6 text-center">No contacts added yet.</p>
                            ) : (
                                contacts.map(c => (
                                    <div key={c.id} className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl hover:border-indigo-500/40 transition">
                                        <p className="font-semibold text-white">
                                            {c.first_name} {c.last_name}
                                        </p>
                                        <p className="text-xs text-slate-400">{c.role || 'No role specified'}</p>
                                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400">
                                            {c.email && <span>✉ {c.email}</span>}
                                            {c.phone_primary && <span>📞 {c.phone_primary}</span>}
                                            {c.is_decision_maker && (
                                                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                                    Decision Maker
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Opportunities Panel */}
                    <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl backdrop-blur-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                Opportunities
                            </h3>
                            <span className="text-xs font-semibold bg-slate-900 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">
                                {opportunities.length}
                            </span>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {opportunities.length === 0 ? (
                                <p className="text-xs text-slate-500 italic py-6 text-center">No opportunities tied to this account.</p>
                            ) : (
                                opportunities.map(o => (
                                    <Link
                                        key={o.id}
                                        to={`/opportunities/${o.id}`}
                                        className="block bg-slate-900/90 border border-slate-800 p-4 rounded-2xl hover:border-emerald-500/40 transition hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-white">{o.name}</p>
                                                <p className="text-xs text-slate-400 mt-1">Stage: <span className="text-indigo-400">{o.stage}</span></p>
                                            </div>
                                            {o.campaign && (
                                                <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                                                    {o.campaign}
                                                </span>
                                            )}
                                        </div>
                                        {o.proposal_value && (
                                            <p className="text-sm font-bold text-emerald-400 mt-2">R {o.proposal_value}</p>
                                        )}
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}