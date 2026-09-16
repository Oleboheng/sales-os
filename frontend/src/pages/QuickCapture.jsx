import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function QuickCapture() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [form, setForm] = useState({
        name: '',
        website: '',
        instagram: '',
        facebook: '',
        phone: '',
        email: '',
        city: '',
        province: '',
        source: 'manual',
        campaign: '',
        notes: ''
    });

    const [showMore, setShowMore] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!form.name || form.name.trim().length < 2) {
            setError('Organisation name is required (minimum 2 characters)');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await api.post('/api/prospecting/quick-capture', form);

            if (res.data.status === 'created') {
                setSuccess({
                    type: 'created',
                    organisation: res.data.organisation,
                    opportunity: res.data.opportunity
                });
                // Auto-navigate after short delay
                setTimeout(() => {
                    navigate(`/opportunities/${res.data.opportunity.id}`);
                }, 2500);
            } else if (res.data.status === 'existing_organisation') {
                setSuccess({
                    type: 'duplicate',
                    organisation: res.data.organisation,
                    matchType: res.data.duplicate.match_type,
                    message: `This organisation already exists (matched by ${res.data.duplicate.match_type})`
                });
                setTimeout(() => {
                    navigate(`/organisations/${res.data.organisation.id}`);
                }, 3000);
            } else if (res.data.status === 'possible_duplicate') {
                setSuccess({
                    type: 'possible_duplicate',
                    organisation: res.data.organisation,
                    message: 'An organisation with this name already exists. Please check before continuing.'
                });
            }
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setError(data.errors.map(e => e.message).join(', '));
            } else if (data?.message) {
                setError(data.message);
            } else {
                setError('Failed to capture prospect. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSuccess(null);
        setError(null);
        setForm({
            name: '',
            website: '',
            instagram: '',
            facebook: '',
            phone: '',
            email: '',
            city: '',
            province: '',
            source: 'manual',
            campaign: '',
            notes: ''
        });
    };

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 p-8 rounded-3xl shadow-xl backdrop-blur-md text-center">
                    {success.type === 'created' && (
                        <>
                            <div className="text-4xl mb-4">✅</div>
                            <h2 className="text-xl font-bold text-white mb-2">Prospect Captured!</h2>
                            <p className="text-slate-300 font-semibold">{success.organisation.name}</p>
                            <div className="mt-2 inline-block bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-sm border border-indigo-500/30">
                                TARGETING
                            </div>
                            <p className="text-slate-400 text-sm mt-4">Redirecting to opportunity...</p>
                            <button
                                onClick={() => navigate('/organisations')}
                                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
                            >
                                View all organisations →
                            </button>
                        </>
                    )}

                    {success.type === 'duplicate' && (
                        <>
                            <div className="text-4xl mb-4">ℹ️</div>
                            <h2 className="text-xl font-bold text-white mb-2">Organisation Already Exists</h2>
                            <p className="text-slate-300 font-semibold">{success.organisation.name}</p>
                            <p className="text-slate-400 text-sm mt-2">{success.message}</p>
                            <p className="text-slate-400 text-sm mt-4">Redirecting to organisation...</p>
                            <button
                                onClick={() => navigate('/organisations')}
                                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
                            >
                                View all organisations →
                            </button>
                        </>
                    )}

                    {success.type === 'possible_duplicate' && (
                        <>
                            <div className="text-4xl mb-4">⚠️</div>
                            <h2 className="text-xl font-bold text-white mb-2">Possible Duplicate</h2>
                            <p className="text-slate-300 font-semibold">{success.organisation.name}</p>
                            <p className="text-slate-400 text-sm mt-2">{success.message}</p>
                            <div className="flex flex-col gap-2 mt-6">
                                <button
                                    onClick={() => navigate(`/organisations/${success.organisation.id}`)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl px-6 shadow-lg transition"
                                >
                                    View Existing Organisation
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl px-6 transition"
                                >
                                    Try Again
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-slate-400 hover:text-white text-xl"
                    >
                        ←
                    </button>
                    <h1 className="text-xl font-bold text-white">Quick Capture</h1>
                </div>

                <p className="text-slate-400 text-sm mb-6">
                    Capture a new prospect in under 30 seconds.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Name - Required */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Organisation Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="ABC Football Academy"
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            required
                        />
                    </div>

                    {/* Website */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Website
                        </label>
                        <input
                            type="url"
                            name="website"
                            value={form.website}
                            onChange={handleChange}
                            placeholder="abcfootballacademy.co.za"
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                    </div>

                    {/* Instagram */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Instagram
                        </label>
                        <input
                            type="text"
                            name="instagram"
                            value={form.instagram}
                            onChange={handleChange}
                            placeholder="@abcfootballacademy"
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                    </div>

                    {/* Source */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Source
                        </label>
                        <select
                            name="source"
                            value={form.source}
                            onChange={handleChange}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        >
                            <option value="manual">Manual</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="google">Google</option>
                            <option value="website">Website</option>
                            <option value="referral">Referral</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Campaign */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Campaign (optional)
                        </label>
                        <input
                            type="text"
                            name="campaign"
                            value={form.campaign}
                            onChange={handleChange}
                            placeholder="football-academies-2026"
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                    </div>

                    {/* Toggle More Details */}
                    <button
                        type="button"
                        onClick={() => setShowMore(!showMore)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                    >
                        {showMore ? '− Fewer details' : '+ More details'}
                    </button>

                    {showMore && (
                        <div className="space-y-4 pt-2 border-t border-slate-700/50">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Facebook
                                </label>
                                <input
                                    type="text"
                                    name="facebook"
                                    value={form.facebook}
                                    onChange={handleChange}
                                    placeholder="facebook.com/abcfootball"
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="011 123 4567"
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="info@abcfootballacademy.co.za"
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    City
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="Johannesburg"
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Province
                                </label>
                                <select
                                    name="province"
                                    value={form.province}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                >
                                    <option value="">Select province...</option>
                                    <option value="Gauteng">Gauteng</option>
                                    <option value="Western Cape">Western Cape</option>
                                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                                    <option value="Eastern Cape">Eastern Cape</option>
                                    <option value="Free State">Free State</option>
                                    <option value="Mpumalanga">Mpumalanga</option>
                                    <option value="North West">North West</option>
                                    <option value="Northern Cape">Northern Cape</option>
                                    <option value="Limpopo">Limpopo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    placeholder="Any initial observations..."
                                    rows="2"
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                        {loading ? 'Capturing...' : 'Capture Prospect'}
                    </button>
                </form>
            </div>
        </div>
    );
}
