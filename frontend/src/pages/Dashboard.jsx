import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import NextActionCard from '../components/dashboard/NextActionCard';
import PipelineOverview from '../components/dashboard/PipelineOverview';
import WorkQueue from '../components/dashboard/WorkQueue';
import DashboardEmptyState from '../components/dashboard/DashboardEmptyState';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        api.get('/api/dashboard/today')
            .then((res) => {
                if (mounted) {
                    setData(res.data);
                    setError('');
                }
            })
            .catch((err) => {
                console.error(err);

                if (mounted) {
                    setError('We could not load your dashboard right now.');
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    if (loading) {
        return (
            <main className="min-h-[calc(100vh-116px)] bg-slate-950 px-4 py-8 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-6xl animate-pulse space-y-6">
                    <div className="space-y-3">
                        <div className="h-3 w-32 rounded bg-slate-800" />
                        <div className="h-10 w-72 rounded bg-slate-800" />
                        <div className="h-4 w-96 max-w-full rounded bg-slate-800" />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-24 rounded-2xl border border-slate-800 bg-slate-900"
                            />
                        ))}
                    </div>

                    <div className="h-64 rounded-3xl border border-slate-800 bg-slate-900" />
                </div>
            </main>
        );
    }

    if (error || !data) {
        return (
            <main className="min-h-[calc(100vh-116px)] bg-slate-950 px-4 py-8 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6">
                        <p className="text-sm font-semibold text-rose-300">
                            {error || 'Dashboard data is unavailable.'}
                        </p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-4 min-h-10 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:text-white"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const today = data.today || {};
    const pipeline = data.pipeline || {};
    const workQueue = data.workQueue || [];
    const hasData = Boolean(data.hasData);

    return (
        <main className="min-h-[calc(100vh-116px)] bg-slate-950 px-4 py-7 text-slate-100 sm:px-6 sm:py-9 lg:px-10">
            <div className="mx-auto max-w-6xl space-y-7 lg:space-y-8">
                <DashboardHeader user={data.user} />

                <DashboardSummary
                    today={today}
                    activeOpportunities={data.activeOpportunities || 0}
                />

                {!hasData ? (
                    <DashboardEmptyState />
                ) : (
                    <>
                        {data.nextAction && (
                            <NextActionCard action={data.nextAction} />
                        )}

                        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                            <PipelineOverview pipeline={pipeline} />
                            <WorkQueue items={workQueue} />
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
