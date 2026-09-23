import React from 'react';

function getGreeting(hour) {
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function formatDate(date) {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

function getTimezoneLabel() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (!timezone) return null;

        const city = timezone.split('/').pop()?.replace(/_/g, ' ');

        return city || null;
    } catch {
        return null;
    }
}

export default function DashboardHeader({ user }) {
    const now = new Date();
    const greeting = getGreeting(now.getHours());
    const timezoneLabel = getTimezoneLabel();

    return (
        <header className="space-y-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-indigo-400 tracking-wide">
                        SOFLAS SALES OS
                    </p>

                    <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white">
                        {greeting},
                        <span className="block text-slate-300 sm:inline sm:ml-2">
                            {user?.name || 'there'}
                        </span>
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Your sales workspace is ready. Here&apos;s what needs your attention.
                    </p>
                </div>

                <div className="shrink-0">
                    <div className="text-left sm:text-right">
                        <p className="text-sm font-semibold text-slate-200">
                            {formatDate(now)}
                        </p>

                        {timezoneLabel && (
                            <p className="mt-1 text-xs text-slate-500">
                                {timezoneLabel}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
