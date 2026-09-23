import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Organisations from './pages/Organisations';
import OpportunityDetail from './pages/OpportunityDetail';
import OrganisationDetail from './pages/OrganisationDetail';
import QuickCapture from './pages/QuickCapture';
import DecisionMaker from './pages/DecisionMaker';
import ProspectingQueue from './pages/ProspectingQueue';
import ProspectExecution from './pages/ProspectExecution';
import MobileNavigation from './components/navigation/MobileNavigation';

function AppContent() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
    };

    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-8">
                    <Link to="/" className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                        SOFLAS <span className="text-indigo-400 font-normal">Sales OS</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/" className="text-sm text-slate-300 hover:text-white transition font-medium">Dashboard</Link>
                        <Link to="/organisations" className="text-sm text-slate-300 hover:text-white transition font-medium">Organisations</Link>
                        <Link to="/queue" className="text-sm text-indigo-400 hover:text-white transition">Queue</Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/quick-capture" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-500 transition shadow-sm">
                        + Capture
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-sm bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white px-3.5 py-2 rounded-xl transition font-medium"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <MobileNavigation />

            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/organisations" element={<Organisations />} />
                <Route path="/organisations/:id" element={<OrganisationDetail />} />
                <Route path="/opportunities/:id" element={<OpportunityDetail />} />
                <Route path="/quick-capture" element={<QuickCapture />} />
                <Route path="/opportunities/:id/decision-maker" element={<DecisionMaker />} />
                <Route path="/queue" element={<ProspectingQueue />} />
                <Route path="/execute/:id" element={<ProspectExecution />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}