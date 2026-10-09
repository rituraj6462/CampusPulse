import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { RegistrationItem, WaitlistEntryItem, CAMPUS_INTERESTS, CampusInterest } from '@campuspulse/shared';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Trophy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Save
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [waitlists, setWaitlists] = useState<WaitlistEntryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Interest edit state
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);
  const [savingInterests, setSavingInterests] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState(false);

  useEffect(() => {
    if (user?.interests) {
      setSelectedInterests(user.interests);
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [regsRes, waitRes] = await Promise.all([
        api.get<{ success: boolean; data: RegistrationItem[] }>('/registrations/my'),
        api.get<{ success: boolean; data: WaitlistEntryItem[] }>('/waitlist/my')
      ]);
      if (regsRes.success) setRegistrations(regsRes.data);
      if (waitRes.success) setWaitlists(waitRes.data);
    } catch (err) {
      console.error('Failed to load student dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSaveInterests = async () => {
    setSavingInterests(true);
    setInterestSuccess(false);
    try {
      await api.put('/auth/profile', { interests: selectedInterests });
      await refreshUser();
      setInterestSuccess(true);
      setTimeout(() => setInterestSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update interests', err);
    } finally {
      setSavingInterests(false);
    }
  };

  const activeRegistrations = registrations.filter(r => r.status === 'CONFIRMED');
  const pastAttendance = registrations.filter(r => r.status === 'ATTENDED');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-6 animate-pulse">
        <div className="h-24 rounded-2xl bg-campus-elevated" />
        <div className="h-64 rounded-2xl bg-campus-elevated" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-campus-border bg-campus-surface p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-subtle">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Student Hub &bull; SRMIST
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-campus-text">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-campus-text-muted">
            {user?.department || 'Department of Computing Technologies'} &bull; Batch of {user?.graduationYear || '2026'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/passport"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-campus-elevated border border-campus-border text-campus-text hover:border-campus-cobalt transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-500" /> View Campus Passport
          </Link>
          <Link
            to="/pulse-match"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-campus-cobalt text-white shadow-sm hover:bg-campus-cobalt-hover transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Pulse Match
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tickets & Waitlists */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Registrations & Tickets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-campus-text flex items-center gap-2">
                <QrCode className="w-5 h-5 text-campus-cobalt" />
                Active Registrations &amp; Passes ({activeRegistrations.length})
              </h2>
            </div>

            {activeRegistrations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-campus-border p-8 text-center space-y-3 bg-campus-surface">
                <p className="text-xs text-campus-text-muted">You have no upcoming confirmed event registrations.</p>
                <Link to="/events" className="inline-block px-4 py-2 text-xs font-semibold rounded-lg bg-campus-cobalt text-white">
                  Discover Campus Events
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="rounded-2xl border border-campus-border bg-campus-surface p-5 sm:p-6 card-hover-effect flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-subtle"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {reg.event?.category}
                        </span>
                        <span className="text-[11px] font-mono text-campus-text-dim">
                          Pass: {reg.ticket?.ticketCode}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-campus-text hover:text-campus-cobalt transition-colors">
                        <Link to={`/events/${reg.event?.slug}`}>
                          {reg.event?.title}
                        </Link>
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-campus-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-campus-cobalt" />
                          {new Date(reg.event?.startDate || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-campus-text-dim" />
                          {reg.event?.venue}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                      {reg.ticket?.ticketCode && (
                        <Link
                          to={`/tickets/${reg.ticket.ticketCode}`}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-campus-cobalt text-white shadow-sm hover:bg-campus-cobalt-hover transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Open Pass
                        </Link>
                      )}
                      <Link
                        to={`/events/${reg.event?.slug}`}
                        className="text-xs text-campus-text-muted hover:text-campus-text font-medium"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Waitlists */}
          {waitlists.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-campus-text flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Active Waitlist Positions ({waitlists.length})
              </h2>

              <div className="space-y-3">
                {waitlists.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-2xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 p-5 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        Waitlist Queue Position #{w.position}
                      </span>
                      <h4 className="text-sm font-bold text-campus-text">
                        <Link to={`/events/${w.event?.slug}`} className="hover:underline">
                          {w.event?.title}
                        </Link>
                      </h4>
                      <p className="text-[11px] text-campus-text-muted">
                        Joined: {new Date(w.joinedAt).toLocaleDateString()} &bull; Automatically notified upon cancellation
                      </p>
                    </div>

                    <Link
                      to={`/events/${w.event?.slug}`}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-900 border border-campus-border text-campus-text hover:border-campus-cobalt transition-colors shrink-0"
                    >
                      View Event
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Event Attendance History */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-campus-text flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Verified Event Attendance History ({pastAttendance.length})
            </h2>

            {pastAttendance.length === 0 ? (
              <div className="rounded-2xl border border-campus-border p-6 bg-campus-surface text-center text-xs text-campus-text-muted">
                No past event attendance records yet. Attend campus events and present your QR pass to check in!
              </div>
            ) : (
              <div className="divide-y divide-campus-border rounded-2xl border border-campus-border bg-campus-surface overflow-hidden">
                {pastAttendance.map((att) => (
                  <div key={att.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-campus-text">{att.event?.title}</h4>
                      <p className="text-[11px] text-campus-text-muted">
                        Attended: {new Date(att.registeredAt).toLocaleDateString()} &bull; {att.event?.venue}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Stamp Earned
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preferences & Interests Editor */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-campus-border bg-campus-surface p-6 shadow-subtle space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-campus-text flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-campus-cobalt" />
                Pulse Match Preferences
              </h3>
              <p className="text-xs text-campus-text-muted">
                Select topics that interest you to personalize your event recommendations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {CAMPUS_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isSelected
                        ? 'bg-campus-cobalt text-white shadow-sm scale-100'
                        : 'border border-campus-border bg-campus-elevated text-campus-text-muted hover:border-campus-cobalt'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{interest}
                  </button>
                );
              })}
            </div>

            {interestSuccess && (
              <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Preferences saved successfully!
              </div>
            )}

            <button
              onClick={handleSaveInterests}
              disabled={savingInterests}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-campus-elevated border border-campus-border text-campus-text hover:border-campus-cobalt transition-colors flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {savingInterests ? 'Saving...' : 'Update Interests'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
