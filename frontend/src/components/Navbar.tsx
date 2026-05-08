import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b-2 border-pulse-white bg-pulse-nav/95 backdrop-blur-sm">
      <div className="fp-container">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-display text-3xl tracking-[-0.08em] text-pulse-white">FeaturePulse</span>
            <span className="rounded-md border border-pulse-violet px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-pulse-violet">
              AI · Vol.III
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {[
              ['/', 'Apps'],
              ['/apps/new', 'Add'],
            ].map(([to, label], index) => (
              <NavLink
                key={`${label}-${index}`}
                to={to}
                className={({ isActive }) =>
                  `border-b-2 pb-1 text-[13px] font-black uppercase tracking-[0.24em] transition ${
                    isActive && index < 2
                      ? 'border-pulse-white text-pulse-white'
                      : 'border-transparent text-pulse-muted hover:text-pulse-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center justify-end gap-4">
            {user && (
              <>
                <div className="hidden items-center gap-3 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pulse-rust text-sm font-bold text-pulse-paper">
                    {(user.name || user.email || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-pulse-white">{user.name || 'Alex Chen'}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-pulse-muted">Editor in Chief</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="fp-btn-muted px-3 py-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Sign out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
