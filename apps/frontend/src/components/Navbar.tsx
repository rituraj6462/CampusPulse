import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Compass,
  Sparkles,
  Users,
  Trophy,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { Role } from '@campuspulse/shared';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Discover', path: '/events', icon: Compass },
    { name: 'Pulse Match', path: '/pulse-match', icon: Sparkles },
    { name: 'Team Up', path: '/team-up', icon: Users },
    { name: 'Campus Passport', path: '/passport', icon: Trophy }
  ];

  if (isAuthenticated) {
    navLinks.push({ name: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard });
    if (user?.role === Role.ORGANIZER || user?.role === Role.ADMIN) {
      navLinks.push({ name: 'Organizer Hub', path: '/organizer', icon: ShieldCheck });
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-campus-border bg-campus-bg/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-campus-cobalt flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-150">
                <span className="font-bold text-lg tracking-tight">CP</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-campus-text group-hover:text-campus-cobalt transition-colors">
                  CampusPulse
                </span>
                <span className="text-[10px] uppercase tracking-wider text-campus-text-dim font-semibold -mt-1">
                  ACM SRMIST Chapter
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-campus-elevated text-campus-cobalt font-semibold border border-campus-border'
                      : 'text-campus-text-muted hover:text-campus-text hover:bg-campus-elevated/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <NotificationDropdown />

                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg border border-campus-border bg-campus-surface hover:bg-campus-elevated transition-colors text-left"
                  >
                    <span className="text-xs font-semibold text-campus-text max-w-[100px] truncate hidden sm:inline">
                      {user?.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold uppercase hidden sm:inline">
                      {user?.role}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name.charAt(0)
                      )}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-campus-text-dim" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-campus-border bg-campus-surface shadow-xl py-1.5 z-50 animate-in fade-in duration-150">
                      <div className="px-3 py-2 border-b border-campus-border-subtle">
                        <p className="text-xs font-semibold text-campus-text truncate">{user?.name}</p>
                        <p className="text-[11px] text-campus-text-muted truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-campus-text hover:bg-campus-elevated"
                      >
                        <LayoutDashboard className="w-4 h-4 text-campus-cobalt" />
                        My Dashboard & Tickets
                      </Link>

                      <Link
                        to="/passport"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-campus-text hover:bg-campus-elevated"
                      >
                        <Trophy className="w-4 h-4 text-amber-500" />
                        My Campus Passport
                      </Link>

                      {(user?.role === Role.ORGANIZER || user?.role === Role.ADMIN) && (
                        <Link
                          to="/organizer"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-campus-text hover:bg-campus-elevated"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          Organizer Analytics & Scanner
                        </Link>
                      )}

                      <div className="my-1 border-t border-campus-border-subtle" />

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-campus-text hover:text-campus-cobalt transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-campus-cobalt text-white shadow-sm hover:bg-campus-cobalt-hover transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="md:hidden p-2 rounded-lg border border-campus-border bg-campus-surface text-campus-text hover:bg-campus-elevated transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-campus-border bg-campus-surface px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active
                    ? 'bg-campus-elevated text-campus-cobalt font-semibold'
                    : 'text-campus-text-muted hover:bg-campus-elevated hover:text-campus-text'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
