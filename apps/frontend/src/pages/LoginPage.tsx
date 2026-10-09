import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-campus-cobalt text-white font-bold flex items-center justify-center mx-auto shadow-md">
          CP
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-campus-text">
          Sign In to CampusPulse
        </h1>
        <p className="text-xs text-campus-text-muted">
          Access your SRMIST tickets, Pulse Match recommendations, and Campus Passport.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl border border-campus-border bg-campus-surface p-6 shadow-card space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-campus-text mb-1">University Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@srmist.edu.in"
              className="w-full px-3 py-2.5 rounded-xl border border-campus-border bg-campus-elevated text-campus-text focus:outline-none focus:border-campus-cobalt"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-campus-text">Password</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl border border-campus-border bg-campus-elevated text-campus-text focus:outline-none focus:border-campus-cobalt"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-campus-cobalt text-white shadow-sm hover:bg-campus-cobalt-hover transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Test Demo Fillers */}
        <div className="pt-4 border-t border-campus-border-subtle space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-campus-text-dim text-center">
            Demo Test Accounts (1-Click Fill)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('student@srmist.edu.in', 'Student@123')}
              className="p-2 rounded-lg border border-campus-border bg-campus-elevated text-[11px] font-semibold text-campus-text hover:border-campus-cobalt text-center"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('organizer@srmist.edu.in', 'Organizer@123')}
              className="p-2 rounded-lg border border-campus-border bg-campus-elevated text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:border-campus-cobalt text-center"
            >
              Organizer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@srmist.edu.in', 'Admin@123')}
              className="p-2 rounded-lg border border-campus-border bg-campus-elevated text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:border-campus-cobalt text-center"
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-campus-text-muted">
        Don't have an account yet?{' '}
        <Link to="/register" className="font-semibold text-campus-cobalt hover:underline">
          Sign up here
        </Link>
      </p>
    </div>
  );
};
