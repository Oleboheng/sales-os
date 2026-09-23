import React from 'react';
import OrganisationCard from './OrganisationCard';

export default function OrganisationList({
    orgs,
    onOpen,
    onAddOpportunity,
    onAddContact
}) {
    if (orgs.length === 0) {
        return (
            <div className="bg-slate-800/40 rounded-3xl border border-slate-700/60 p-10 sm:p-16 text-center text-slate-400 backdrop-blur-sm">
                <p className="text-sm">
                    No organisations found. Create your first one using the New Organisation button.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {orgs.map((org) => (
                <OrganisationCard
                    key={org.id}
                    org={org}
                    onOpen={() => onOpen(org)}
                    onAddOpportunity={() => onAddOpportunity(org)}
                    onAddContact={() => onAddContact(org)}
                />
            ))}
        </div>
    );
}
