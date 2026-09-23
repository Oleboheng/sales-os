import React from 'react';

export default function OrganisationActionModal({
    modalType,
    activeOrg,
    setModalType,
    oppForm,
    setOppForm,
    contactForm,
    setContactForm,
    onCreateOpportunity,
    onCreateContact
}) {
    if (!modalType || !activeOrg) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                    <div className="min-w-0 pr-4">
                        <h3 className="text-base font-bold text-white capitalize">
                            Add {modalType}
                        </h3>
                        <p
                            title={activeOrg.name}
                            className="text-xs text-indigo-400 mt-0.5 font-medium truncate"
                        >
                            {activeOrg.name}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setModalType(null)}
                        className="shrink-0 text-slate-400 hover:text-white text-xl font-bold bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {modalType === 'opportunity' && (
                    <form onSubmit={onCreateOpportunity} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Opportunity Type
                            </label>
                            <select
                                value={oppForm.opportunity_type}
                                onChange={(e) => setOppForm({
                                    ...oppForm,
                                    opportunity_type: e.target.value
                                })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="SPORTS_MANAGEMENT">Sports Management</option>
                                <option value="WEBSITE">Website</option>
                                <option value="BOOKING_SYSTEM">Booking System</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Opportunity Name
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Enterprise License Deal"
                                value={oppForm.name}
                                onChange={(e) => setOppForm({
                                    ...oppForm,
                                    name: e.target.value
                                })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Estimated Value (ZAR)
                            </label>
                            <input
                                type="number"
                                placeholder="50000"
                                value={oppForm.value}
                                onChange={(e) => setOppForm({
                                    ...oppForm,
                                    value: e.target.value
                                })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition"
                        >
                            Save Opportunity
                        </button>
                    </form>
                )}

                {modalType === 'contact' && (
                    <form onSubmit={onCreateContact} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                First Name
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="John"
                                value={contactForm.first_name}
                                onChange={(e) => setContactForm({
                                    ...contactForm,
                                    first_name: e.target.value
                                })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Last Name
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="Smith"
                                value={contactForm.last_name}
                                onChange={(e) => setContactForm({
                                    ...contactForm,
                                    last_name: e.target.value
                                })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="john@example.com"
                                value={contactForm.email}
                                onChange={(e) => setContactForm({
                                    ...contactForm,
                                    email: e.target.value
                                })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Phone (Primary)
                            </label>
                            <input
                                type="text"
                                placeholder="+27 82 123 4567"
                                value={contactForm.phone_primary}
                                onChange={(e) => setContactForm({
                                    ...contactForm,
                                    phone_primary: e.target.value
                                })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Role
                            </label>
                            <input
                                type="text"
                                placeholder="Academy Director"
                                value={contactForm.role}
                                onChange={(e) => setContactForm({
                                    ...contactForm,
                                    role: e.target.value
                                })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                Title (optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Head Coach"
                                value={contactForm.title}
                                onChange={(e) => setContactForm({
                                    ...contactForm,
                                    title: e.target.value
                                })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={contactForm.is_decision_maker}
                                onChange={(e) => setContactForm({
                                    ...contactForm,
                                    is_decision_maker: e.target.checked
                                })}
                                className="w-4 h-4"
                            />
                            <span className="text-xs text-slate-300">
                                Decision Maker
                            </span>
                        </label>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition"
                        >
                            Save Contact
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
