import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardEmptyState() {
    return (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 px-5 py-12 text-center shadow-xl sm:px-8 sm:py-16">
            <div className="mx-auto max-w-lg">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-xl text-indigo-400">
                    +
                </div>

                <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
                    You&apos;re all set.
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                    Your Sales OS is ready for your first prospect.
                </p>

                <Link
                    to="/organisations"
                    className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
                >
                    Add your first organisation
                </Link>

                <p className="mx-auto mt-5 max-w-md text-xs leading-5 text-slate-600">
                    Once you add an organisation, Sales OS can help you research it,
                    create an opportunity and determine the next action.
                </p>
            </div>
        </section>
    );
}
