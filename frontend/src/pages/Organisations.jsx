import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import OrganisationForm from '../components/organisations/OrganisationForm';
import OrganisationList from '../components/organisations/OrganisationList';
import OrganisationActionModal from '../components/organisations/OrganisationActionModal';

const emptyOrgForm = {
    name: '',
    province: 'Gauteng',
    website: '',
    phone: '',
    notes: ''
};

const emptyOppForm = {
    name: '',
    value: '',
    stage: 'researched',
    opportunity_type: 'SPORTS_MANAGEMENT'
};

const emptyContactForm = {
    first_name: '',
    last_name: '',
    email: '',
    phone_primary: '',
    role: '',
    title: '',
    is_decision_maker: false
};

export default function Organisations() {
    const [orgs, setOrgs] = useState([]);
    const [form, setForm] = useState(emptyOrgForm);
    const [loading, setLoading] = useState(false);
    const [mobileFormOpen, setMobileFormOpen] = useState(false);

    const navigate = useNavigate();

    const [activeOrg, setActiveOrg] = useState(null);
    const [modalType, setModalType] = useState(null);

    const [oppForm, setOppForm] = useState(emptyOppForm);
    const [contactForm, setContactForm] = useState(emptyContactForm);

    const fetchOrgs = () => {
        api.get('/api/organisations')
            .then(res => setOrgs(res.data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const handleOrgSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/api/organisations', form);
            setForm(emptyOrgForm);
            setMobileFormOpen(false);
            fetchOrgs();
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating organisation');
        } finally {
            setLoading(false);
        }
    };

    const openMobileOrganisationForm = () => {
        setMobileFormOpen(true);
    };

    const closeMobileOrganisationForm = () => {
        if (!loading) {
            setMobileFormOpen(false);
        }
    };

    const openOpportunityModal = (org) => {
        setActiveOrg(org);
        setModalType('opportunity');
    };

    const openContactModal = (org) => {
        setActiveOrg(org);
        setModalType('contact');
    };

    const closeActionModal = () => {
        setModalType(null);
        setActiveOrg(null);
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

            closeActionModal();
            setOppForm(emptyOppForm);
            alert('Opportunity created successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating opportunity');
        }
    };

    const handleCreateContact = async (e) => {
        e.preventDefault();

        try {
            await api.post(`/api/organisations/${activeOrg.id}/contacts`, contactForm);

            closeActionModal();
            setContactForm(emptyContactForm);
            alert('Contact created successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating contact');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-6 md:p-10 selection:bg-indigo-500 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/50 border border-slate-700/60 p-5 sm:p-6 rounded-3xl backdrop-blur-xl shadow-xl">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <span className="shrink-0 w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"></span>
                            <h1 className="min-w-0 text-2xl md:text-3xl font-black tracking-tight text-white truncate">
                                Organisations & Pipeline
                            </h1>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                            Manage accounts, spin up deals, and capture key stakeholders.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <Link
                            to="/"
                            className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl border border-slate-700 transition shadow-sm"
                        >
                            Dashboard
                        </Link>

                        <Link
                            to="/organisations"
                            className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2.5 rounded-xl transition"
                        >
                            Organisations
                        </Link>
                    </div>
                </header>

                <div className="lg:hidden">
                    <button
                        type="button"
                        onClick={openMobileOrganisationForm}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/25 transition active:scale-[0.99]"
                    >
                        + New Organisation
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                    <div className="hidden lg:block lg:sticky lg:top-6 h-fit bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl backdrop-blur-md">
                        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            New Organisation
                        </h2>

                        <OrganisationForm
                            form={form}
                            setForm={setForm}
                            loading={loading}
                            onSubmit={handleOrgSubmit}
                        />
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center px-1 gap-3">
                            <h2 className="text-lg font-bold text-white">
                                Active Accounts
                            </h2>

                            <span className="shrink-0 text-xs font-semibold bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
                                {orgs.length} Total
                            </span>
                        </div>

                        <OrganisationList
                            orgs={orgs}
                            onOpen={(org) => navigate(`/organisations/${org.id}`)}
                            onAddOpportunity={openOpportunityModal}
                            onAddContact={openContactModal}
                        />
                    </div>
                </div>

                {mobileFormOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 lg:hidden">
                        <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[94dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
                            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                                <div className="min-w-0">
                                    <h2 className="text-base font-bold text-white">
                                        New Organisation
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Add an account to your shared workspace.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeMobileOrganisationForm}
                                    disabled={loading}
                                    className="shrink-0 text-slate-400 hover:text-white text-xl font-bold bg-slate-800 w-9 h-9 rounded-full flex items-center justify-center transition disabled:opacity-50"
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>

                            <OrganisationForm
                                form={form}
                                setForm={setForm}
                                loading={loading}
                                onSubmit={handleOrgSubmit}
                                onCancel={closeMobileOrganisationForm}
                                showCancel
                            />
                        </div>
                    </div>
                )}

                <OrganisationActionModal
                    modalType={modalType}
                    activeOrg={activeOrg}
                    setModalType={closeActionModal}
                    oppForm={oppForm}
                    setOppForm={setOppForm}
                    contactForm={contactForm}
                    setContactForm={setContactForm}
                    onCreateOpportunity={handleCreateOpportunity}
                    onCreateContact={handleCreateContact}
                />
            </div>
        </div>
    );
}
