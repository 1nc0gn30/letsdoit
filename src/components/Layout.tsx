import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Map, Calendar, Sparkles, User, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', label: 'Home', icon: Compass },
  { to: '/explore', label: 'Explore', icon: Map },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/daily-picks', label: 'Picks', icon: Sparkles },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isOnboarding = !user || (profile && (!profile.preferences || profile.preferences.length === 0));
  if (isOnboarding) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-[1200] bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-indigo-400">
            <Compass size={22} />
            <span className="font-bold text-white tracking-tight">Navi</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-bold bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">⭐ {profile.credibility_score}</span>
                <span className="text-[10px] font-bold bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full border border-green-500/20">🔥 {profile.streak}</span>
              </div>
            )}
            <button
              className="md:hidden p-2 text-slate-400 hover:bg-slate-800 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[1190] bg-slate-950/90 backdrop-blur-sm md:hidden pt-14">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <main className="flex-1 pt-14">{children}</main>
    </div>
  );
}
