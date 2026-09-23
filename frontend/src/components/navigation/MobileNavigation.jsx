import { Link, useLocation } from 'react-router-dom';

const items = [
    { label: 'Dashboard', to: '/' },
    { label: 'Organisations', to: '/organisations' },
    { label: 'Queue', to: '/queue' }
];

export default function MobileNavigation() {
    const location = useLocation();

    const isActive = (to) => {
        if (to === '/') {
            return location.pathname === '/';
        }

        return location.pathname === to || location.pathname.startsWith(`${to}/`);
    };

    return (
        <nav
            aria-label="Mobile navigation"
            className="md:hidden border-t border-slate-800 bg-slate-900 px-2 py-2"
        >
            <div className="grid grid-cols-3 gap-1">
                {items.map((item) => {
                    const active = isActive(item.to);

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center justify-center min-h-11 rounded-xl px-2 text-xs font-semibold transition ${
                                active
                                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
