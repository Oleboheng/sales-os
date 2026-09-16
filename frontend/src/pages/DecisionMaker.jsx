import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DecisionMaker() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [state, setState] = useState(null);
    const [people, setPeople] = useState([]);
    const [selectedPersonId, setSelectedPersonId] = useState('');
    const [status, setStatus] = useState('NOT_IDENTIFIED');
    const [notes, setNotes] = useState('');
    const [personUpdates, setPersonUpdates] = useState({
        authority_level: 'UNKNOWN',
        confidence_level: 'UNKNOWN',
        preferred_channel: 'UNKNOWN',
        intelligence_evidence: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch decision-maker state
            const stateRes = await api.get(`/api/opportunities/${id}/decision-maker`);
            setState(stateRes.data);
            setStatus(stateRes.data.decision_maker_status || 'NOT_IDENTIFIED');
            setNotes(stateRes.data.decision_maker_notes || '');
            if (stateRes.data.person) {
                setSelectedPersonId(stateRes.data.person.id);
                setPersonUpdates({
                    authority_level: stateRes.data.person.authority_level || 'UNKNOWN',
                    confidence_level: stateRes.data.person.confidence_level || 'UNKNOWN',
                    preferred_channel: stateRes.data.person.preferred_channel || 'UNKNOWN',
                    intelligence_evidence: stateRes.data.person.intelligence_evidence || ''
                });
            } else {
                setSelectedPersonId('');
                setPersonUpdates({
                    authority_level: 'UNKNOWN',
                    confidence_level: 'UNKNOWN',
                    preferred_channel: 'UNKNOWN',
                    intelligence_evidence: ''
                });
            }

            // Fetch people for this organisation (we need the organisation id)
            // First, get the opportunity to know organisation_id
            const oppRes = await api.get(`/api/opportunities/${id}`);
            const orgId = oppRes.data.organisation_id;
            const peopleRes = await api.get(`/api/organisations/${orgId}/contacts`);
            setPeople(peopleRes.data);
        } catch (err) {
            setError('Failed to load decision-maker data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [id]);

    const handleStatusChange = (e) => setStatus(e.target.value);
    const handlePersonChange = (e) => {
        const pid = e.target.value;
        setSelectedPersonId(pid);
        // If person changes, reset personUpdates or load from state? We'll let the user fill.
        // We could pre-fill from existing person data if available, but we'll keep it manual.
    };
    const handleNotesChange = (e) => setNotes(e.target.value);
    const handlePersonFieldChange = (field, value) => {
        setPersonUpdates(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        // Validate: if status is IDENTIFIED, must select a person
        if (status === 'IDENTIFIED' && !selectedPersonId) {
            setError('You must select a person when status is IDENTIFIED.');
            setSaving(false);
            return;
        }
        if (status === 'NOT_IDENTIFIED' && selectedPersonId) {
            setError('Cannot select a person when status is NOT_IDENTIFIED.');
            setSaving(false);
            return;
        }

        try {
            const payload = {
                status,
                person_id: selectedPersonId || null,
                notes: notes || null,
                person_updates: selectedPersonId ? personUpdates : null
            };
            await api.put(`/api/opportunities/${id}/decision-maker`, payload);
            setSuccess('Decision-maker updated successfully!');
            // Refresh data
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save decision-maker.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></span>
                    <p className="text-slate-400 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-10 selection:bg-indigo-500 selection:text-white">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-2">
                    <Link to={`/opportunities/${id}`} className="text-xs text-indigo-400 hover:underline">
                        ← Back to Opportunity
                    </Link>
                </div>

                <h1 className="text-2xl font-bold text-white">Decision-Maker Intelligence</h1>
                <p className="text-sm text-slate-400">Identify who to contact and how.</p>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-sm text-red-300">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-xl text-sm text-green-300">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Status Selection */}
                    <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl">
                        <h3 className="text-base font-bold text-white mb-4">Decision Maker Status</h3>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    value="IDENTIFIED"
                                    checked={status === 'IDENTIFIED'}
                                    onChange={handleStatusChange}
                                    className="w-4 h-4 accent-indigo-500"
                                />
                                Identified
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    value="UNCERTAIN"
                                    checked={status === 'UNCERTAIN'}
                                    onChange={handleStatusChange}
                                    className="w-4 h-4 accent-indigo-500"
                                />
                                Uncertain
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    value="NOT_IDENTIFIED"
                                    checked={status === 'NOT_IDENTIFIED'}
                                    onChange={handleStatusChange}
                                    className="w-4 h-4 accent-indigo-500"
                                />
                                Not Identified
                            </label>
                        </div>
                    </div>

                    {/* Person Selection */}
                    <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl">
                        <h3 className="text-base font-bold text-white mb-4">Select a Person</h3>
                        <select
                            value={selectedPersonId}
                            onChange={handlePersonChange}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={status === 'NOT_IDENTIFIED'}
                        >
                            <option value="">-- Select a person --</option>
                            {people.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.first_name} {p.last_name} ({p.role || 'No role'})
                                </option>
                            ))}
                        </select>
                        {people.length === 0 && (
                            <p className="text-xs text-slate-400 mt-2">
                                No people found. <Link to={`/organisations/${state?.opportunity_id}`} className="text-indigo-400 hover:underline">Add a person</Link>
                            </p>
                        )}
                    </div>

                    {/* Person Intelligence Fields (only if person selected) */}
                    {selectedPersonId && (
                        <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl">
                            <h3 className="text-base font-bold text-white mb-4">Person Intelligence</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Authority</label>
                                    <select
                                        value={personUpdates.authority_level}
                                        onChange={(e) => handlePersonFieldChange('authority_level', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="HIGH">High</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="LOW">Low</option>
                                        <option value="UNKNOWN">Unknown</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Confidence</label>
                                    <select
                                        value={personUpdates.confidence_level}
                                        onChange={(e) => handlePersonFieldChange('confidence_level', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="HIGH">High</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="LOW">Low</option>
                                        <option value="UNKNOWN">Unknown</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Preferred Channel</label>
                                    <select
                                        value={personUpdates.preferred_channel}
                                        onChange={(e) => handlePersonFieldChange('preferred_channel', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="WHATSAPP">WhatsApp</option>
                                        <option value="PHONE">Phone</option>
                                        <option value="EMAIL">Email</option>
                                        <option value="LINKEDIN">LinkedIn</option>
                                        <option value="UNKNOWN">Unknown</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Evidence / Notes</label>
                                    <textarea
                                        value={personUpdates.intelligence_evidence}
                                        onChange={(e) => handlePersonFieldChange('intelligence_evidence', e.target.value)}
                                        rows="3"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        placeholder="e.g. Academy website identifies John as Academy Director."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Decision-Maker Notes */}
                    <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl">
                        <h3 className="text-base font-bold text-white mb-4">Decision-Maker Notes</h3>
                        <textarea
                            value={notes}
                            onChange={handleNotesChange}
                            rows="2"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Additional context about decision-maker status..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Decision-Maker'}
                    </button>
                </form>
            </div>
        </div>
    );
}
