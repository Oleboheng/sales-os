import React, { useState } from 'react';
import api from '../services/api';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let res;
            if (isRegister) {
                res = await api.post('/api/auth/register', { email, name, password });
            } else {
                res = await api.post('/api/auth/login', { email, password });
            }
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            onLogin(user);
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50">
            {/* Left Brand / Visual Panel */}
            <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-900 to-indigo-950/40 pointer-events-none" />
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30">
                        S
                    </div>
                    <span className="font-semibold text-lg tracking-tight">SOFLAS Sales OS</span>
                </div>

                <div className="relative z-10 my-auto max-w-md">
                    <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-blue-400 uppercase bg-blue-500/10 rounded-full border border-blue-500/20">
                        Enterprise Operations
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4 leading-tight">
                        Streamline your pipeline, accelerate revenue.
                    </h1>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        A centralized system engineered for high-performance sales teams, automated pipelines, and precision tracking.
                    </p>
                </div>

                <div className="relative z-10 text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} SOFLAS Developments. All rights reserved.
                </div>
            </div>

            {/* Right Form Container */}
            <div className="col-span-1 lg:col-span-7 xl:col-span-6 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div>
                        <div className="lg:hidden flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
                                S
                            </div>
                            <span className="font-semibold text-slate-900">SOFLAS Sales OS</span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {isRegister ? 'Create an account' : 'Welcome back'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {isRegister 
                                ? 'Enter your details below to set up your account.' 
                                : 'Please enter your credentials to access your workspace.'}
                        </p>
                    </div>

                    {error && (
                        <div className="p-3.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isRegister && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Password
                                </label>
                                {!isRegister && (
                                    <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                        Forgot password?
                                    </a>
                                )}
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 focus:outline-none focus:ring-4 focus:ring-blue-600/20 transition-all disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {isRegister ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <p className="text-sm text-slate-600">
                            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    setError('');
                                }}
                                className="font-semibold text-blue-600 hover:text-blue-700 ml-1 transition-colors"
                            >
                                {isRegister ? 'Sign in' : 'Create one'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}