// frontend/src/pages/Organisations.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Organisations() {
    const [orgs, setOrgs] = useState([]);
    const [form, setForm] = useState({ name: '', province: 'Gauteng', website: '', phone: '', notes: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    // Modal states for creating Opportunity, Contact, and Note within an Organization
    const [activeOrg, setActiveOrg] = useState(null);
    const [modalType, setModalType] = useState(null); // 'opportunity', 'contact', 'note'
    
    // Sub-forms
    const [oppForm, setOppForm] = useState({
        name: '',
        value: '',
        stage: 'researched',
        opportunity_type: 'SPORTS_MANAGEMENT'
    });
    const [contactForm, setContactForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_primary: '',
        role: '',
        title: '',
        is_decision_maker: false
    });

    const fetchOrgs = () => {
        api.get('/api/organisations').then(res => setOrgs(res.data)).catch(console.error);
    };

    useEffect(() => { fetchOrgs(); }, []);

    const handleOrgSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/organisations', form);
            setForm({ name: '', province: 'Gauteng', website: '', phone: '', notes: '' });
            fetchOrgs();
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating organisation');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOpportunity = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/api/organisations/${activeOrg.id}/opportunities`, {
                name: oppForm.name,
                opportunity_type: oppForm.opportunity_type,
                campaign: 'default',
                source: 'manual'
            });
            setModalType(null);
            setOppForm({
                name: '',
                value: '',
                stage: 'researched',
                opportunity_type: 'SPORTS_MANAGEMENT'
            });
            alert('Opportunity created successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating opportunity');
        }
    };

    const handleCreateContact = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/api/organisations/${activeOrg.id}/contacts`, contactForm);
            setModalType(null);
            setContactForm({
                first_name: '',
                last_name: '',
                email: '',
                phone_primary: '',
                role: '',
                title: '',
                is_decision_maker: false
            });
            alert('Contact created successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating contact');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-10 selection:bg-indigo-500 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Navigation & Quick Navigation Links */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/50 border border-slate-700/60 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"></span>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Organisations & Pipeline</h1>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">Manage accounts, spin up deals, and capture key stakeholders.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link to="/" className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl border border-slate-700 transition shadow-sm">
                            Dashboard
                        </Link>
                        <Link to="/organisations" className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2.5 rounded-xl transition">
                            Organisations
                        </Link>
                    </div>
                </header>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Add Organisation Card */}
                    <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl backdrop-blur-md h-fit sticky top-6">
                        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            New Organisation
                        </h2>
                        <form onSubmit={handleOrgSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Company Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Acme Corp"
                                    value={form.name}
                                    onChange={(e) => setForm({...form, name: e.target.value})}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Province</label>
                                <select
                                    value={form.province}
                                    onChange={(e) => setForm({...form, province: e.target.value})}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                >
                                    <option value="Gauteng">Gauteng</option>
                                    <option value="Western Cape">Western Cape</option>
                                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Website</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com"
                                    value={form.website}
                                    onChange={(e) => setForm({...form, website: e.target.value})}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone</label>
                                <input
                                    type="text"
                                    placeholder="+27..."
                                    value={form.phone}
                                    onChange={(e) => setForm({...form, phone: e.target.value})}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Notes</label>
                                <textarea
                                    rows="2"
                                    placeholder="Initial context..."
                                    value={form.notes}
                                    onChange={(e) => setForm({...form, notes: e.target.value})}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                                />
                            </div>
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Organisation'}
                            </button>
                        </form>
                    </div>

                    {/* Organisations List Grid */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-lg font-bold text-white">Active Accounts</h2>
                            <span className="text-xs font-semibold bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
                                {orgs.length} Total
                            </span>
                        </div>

                        {orgs.length === 0 ? (
                            <div className="bg-slate-800/40 rounded-3xl border border-slate-700/60 p-16 text-center text-slate-400 backdrop-blur-sm">
                                <p className="text-sm">No organisations found. Create your first one on the left.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orgs.map(org => (
                                    <div key={org.id} className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-lg hover:border-slate-600 transition duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="space-y-1 cursor-pointer" onClick={() => navigate(`/organisations/${org.id}`)}>
                                            <h3 className="text-lg font-bold text-white tracking-wide hover:text-indigo-400 transition">{org.name}</h3>
                                            <p className="text-xs text-slate-400 flex items-center gap-3">
                                                <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/60">📍 {org.province}</span>
                                                {org.website && <span className="text-indigo-400 truncate max-w-[240px]">🔗 {org.website}</span>}
                                            </p>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { setActiveOrg(org); setModalType('opportunity'); }}
                                                className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
                                            >
                                                + Opportunity
                                            </button>
                                            <button
                                                onClick={() => { setActiveOrg(org); setModalType('contact'); }}
                                                className="bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
                                            >
                                                + Contact
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Modals */}
                {modalType && activeOrg && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-base font-bold text-white capitalize">
                                        Add {modalType}
                                    </h3>
                                    <p className="text-xs text-indigo-400 mt-0.5 font-medium">{activeOrg.name}</p>
                                </div>
                                <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white text-xl font-bold bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition">×</button>
                            </div>

                            {modalType === 'opportunity' && (
                                <form onSubmit={handleCreateOpportunity} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Opportunity Type</label>
                                        <select
                                            value={oppForm.opportunity_type}
                                            onChange={(e) => setOppForm({...oppForm, opportunity_type: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="SPORTS_MANAGEMENT">Sports Management</option>
                                            <option value="WEBSITE">Website</option>
                                            <option value="BOOKING_SYSTEM">Booking System</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Opportunity Name</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="e.g. Enterprise License Deal"
                                            value={oppForm.name}
                                            onChange={(e) => setOppForm({...oppForm, name: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Estimated Value (ZAR)</label>
                                        <input
                                            type="number"
                                            placeholder="50000"
                                            value={oppForm.value}
                                            onChange={(e) => setOppForm({...oppForm, value: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition">
                                        Save Opportunity
                                    </button>
                                </form>
                            )}

                            {modalType === 'contact' && (
                                <form onSubmit={handleCreateContact} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">First Name</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="John"
                                            value={contactForm.first_name}
                                            onChange={(e) => setContactForm({...contactForm, first_name: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Last Name</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Smith"
                                            value={contactForm.last_name}
                                            onChange={(e) => setContactForm({...contactForm, last_name: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            placeholder="john@example.com"
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone (Primary)</label>
                                        <input
                                            type="text"
                                            placeholder="+27 82 123 4567"
                                            value={contactForm.phone_primary}
                                            onChange={(e) => setContactForm({...contactForm, phone_primary: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Role</label>
                                        <input
                                            type="text"
                                            placeholder="Academy Director"
                                            value={contactForm.role}
                                            onChange={(e) => setContactForm({...contactForm, role: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Title (optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Head Coach"
                                            value={contactForm.title}
                                            onChange={(e) => setContactForm({...contactForm, title: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={contactForm.is_decision_maker}
                                            onChange={(e) => setContactForm({...contactForm, is_decision_maker: e.target.checked})}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-xs text-slate-300">Decision Maker</label>
                                    </div>
                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition">
                                        Save Contact
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}