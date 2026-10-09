import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role, CAMPUS_INTERESTS } from '@campuspulse/shared';
import { UserPlus, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState(2026);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['AI & Machine Learning', 'Web Development']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        name,
        email,
        password,
        role: Role.STUDENT,
        department,
        graduationYear: Number(graduationYear),
        interests: selectedInterests
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-campus-cobalt text-white font-bold flex items-center justify-center mx-auto shadow-md">
          CP
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-campus-text">
          Join CampusPulse SRMIST
        </h1>
        <p className="text-xs text-campus-text-muted">
          Create your verified student profile and unlock your digital Campus Passport.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-campus-border bg-campus-surface p-6 sm:p-8 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-campus-text mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diya Sharma"
              className="w-full px-3 py-2.5 rounded-xl border border-campus-border bg-campus-elevated text-campus-text focus:outline-none focus:border-campus-cobalt"
            />
          </div>

          <div>
            <label className="block font-semibold text-campus-text mb-1">University Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ds1234@srmist.edu.in"
              className="w-full px-3 py-2.5 rounded-xl border border-campus-border bg-campus-elevated text-campus-text focus:outline-none focus:border-campus-cobalt"
            />
          </div>

          <div>
            <label className="block font-semibold text-campus-text mb-1">Password (min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl border border-campus-border bg-campus-elevated text-campus-text focus:outline-none focus:border-campus-cobalt"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-campus-text mb-1">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-campus-border bg-campus-elevated text-campus-text"
              />
            </div>
            <div>
              <label className="block font-semibold text-campus-text mb-1">Graduation Year</label>
              <input
                type="number"
                min={2024}
                max={2030}
                required
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-campus-border bg-campus-elevated text-campus-text"
              />
            </div>
          </div>

          {/* Interests for Pulse Match */}
          <div className="pt-2">
            <label className="block font-semibold text-campus-text mb-1.5">
              Select Your Tech Interests (For Pulse Match)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CAMPUS_INTERESTS.slice(0, 8).map((interest) => {
                const active = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      active
                        ? 'bg-campus-cobalt text-white shadow-sm'
                        : 'border border-campus-border bg-campus-elevated text-campus-text-muted hover:border-campus-cobalt'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}{interest}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-campus-cobalt text-white shadow-sm hover:bg-campus-cobalt-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center text-xs text-campus-text-muted">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-campus-cobalt hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
};
