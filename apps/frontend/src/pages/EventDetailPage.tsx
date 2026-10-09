import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { EventItem, TeamItem, RegistrationStatus, WaitlistStatus } from '@campuspulse/shared';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Sparkles,
  QrCode,
  Download,
  AlertCircle,
  CheckCircle2,
  Share2,
  UserPlus
} from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadEvent = async () => {
    if (!slug) return;
    try {
      const res = await api.get<{ success: boolean; data: EventItem }>(`/events/${slug}`);
      if (res.success) {
        setEvent(res.data);
        if (res.data.isHackathon) {
          const teamRes = await api.get<{ success: boolean; data: TeamItem[] }>(`/events/${res.data.id}/teams`);
          if (teamRes.success) {
            setTeams(teamRes.data);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [slug, user?.id]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!event) return;

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.post<{ success: boolean; message: string; data: any }>(`/events/${event.id}/register`);
      if (res.success) {
        setSuccessMessage('Registration confirmed! Your QR boarding pass has been issued.');
        await loadEvent();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!event) return;
    if (!window.confirm('Are you sure you want to cancel your registration? Your reserved seat will immediately be offered to the next waitlisted student.')) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.post<{ success: boolean; message: string }>(`/events/${event.id}/cancel`);
      if (res.success) {
        setSuccessMessage('Registration cancelled. Any waitlisted peer was promoted.');
        await loadEvent();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!event) return;

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.post<{ success: boolean; message: string; data: any }>(`/events/${event.id}/waitlist/join`);
      if (res.success) {
        setSuccessMessage(res.message);
        await loadEvent();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to join waitlist.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!event) return;
    setActionLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/events/${event.id}/waitlist/leave`);
      if (res.success) {
        setSuccessMessage('You have left the waitlist.');
        await loadEvent();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to leave waitlist.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4 animate-pulse">
        <div className="h-64 rounded-2xl bg-campus-elevated" />
        <div className="h-8 w-2/3 bg-campus-elevated mx-auto rounded" />
        <div className="h-4 w-1/2 bg-campus-elevated mx-auto rounded" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-campus-text">Event Not Found</h2>
        <p className="text-xs text-campus-text-muted">The event listing you are looking for may have expired or moved.</p>
        <Link to="/events" className="inline-block px-4 py-2 rounded-lg bg-campus-cobalt text-white text-xs font-semibold">
          Return to Discovery
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const deadline = new Date(event.registrationDeadline);
  const isPastDeadline = deadline < new Date();
  const isFull = event.availableSeats === 0;
  const isRegistered = event.userRegistration?.status === RegistrationStatus.CONFIRMED;
  const isWaitlisted = event.userWaitlist && (event.userWaitlist.status === WaitlistStatus.WAITING || event.userWaitlist.status === WaitlistStatus.OFFERED);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 dark:text-emerald-300">&times;</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 dark:text-rose-300">&times;</button>
        </div>
      )}

      {/* Hero Showcase Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-campus-border bg-campus-elevated shadow-card">
        <div className="h-72 sm:h-96 relative overflow-hidden">
          <img
            src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Top Overlays */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 dark:bg-black/80 text-black dark:text-white backdrop-blur-md shadow-sm">
              {event.category}
            </span>

            <div className="flex items-center gap-2">
              <a
                href={`/api/events/${event.slug}/calendar.ics`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-black/80 text-campus-text hover:bg-white backdrop-blur-md transition-colors"
                title="Add to Google Calendar or iCal"
              >
                <Download className="w-3.5 h-3.5" />
                Add to Calendar (.ics)
              </a>
            </div>
          </div>

          {/* Bottom Title Header */}
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            {event.isHackathon && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-black shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Official Hackathon &bull; Team Up Enabled
              </span>
            )}
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {event.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 max-w-3xl">
              {event.shortDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Action Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Information */}
        <div className="lg:col-span-8 space-y-8">
          {/* Key Event Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl border border-campus-border bg-campus-surface shadow-subtle">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-campus-cobalt shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-campus-text-dim uppercase tracking-wider">Date &amp; Time</p>
                <p className="text-xs font-bold text-campus-text mt-0.5">
                  {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-[11px] text-campus-text-muted">
                  {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &ndash; {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-campus-cobalt shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-campus-text-dim uppercase tracking-wider">Campus Location</p>
                <p className="text-xs font-bold text-campus-text mt-0.5">{event.venue}</p>
                {event.address && (
                  <p className="text-[11px] text-campus-text-muted truncate max-w-[160px]">{event.address}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-campus-cobalt shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-campus-text-dim uppercase tracking-wider">Host &amp; Organizer</p>
                <p className="text-xs font-bold text-campus-text mt-0.5">{event.organizer?.name || 'ACM Chapter SRMIST'}</p>
                <p className="text-[11px] text-campus-text-muted">{event.organizer?.department || 'Computing SIG'}</p>
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-4 rounded-2xl border border-campus-border bg-campus-surface p-6">
            <h2 className="text-lg font-bold text-campus-text">About This Event</h2>
            <div className="text-xs sm:text-sm text-campus-text-muted leading-relaxed whitespace-pre-line space-y-3">
              {event.description}
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="pt-4 border-t border-campus-border-subtle flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-campus-text-dim">Key Topics:</span>
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-campus-elevated text-campus-text-muted border border-campus-border-subtle"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Team Up Section (for Hackathons) */}
          {event.isHackathon && (
            <div className="rounded-2xl border border-campus-border bg-campus-surface p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-campus-text">Team Up &bull; Hackathon Rosters</h3>
                    <p className="text-xs text-campus-text-muted">Find teammates with complementary skills or build a team.</p>
                  </div>
                </div>

                <Link
                  to="/team-up"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-campus-elevated border border-campus-border text-campus-text hover:border-campus-cobalt transition-colors"
                >
                  Manage Teams Hub
                </Link>
              </div>

              {teams.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-campus-border text-center space-y-2">
                  <p className="text-xs text-campus-text-muted">No teams registered yet for this hackathon.</p>
                  {isRegistered && (
                    <Link to="/team-up" className="text-xs font-bold text-campus-cobalt hover:underline">
                      Be the first to create a team &rarr;
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teams.map((t) => (
                    <div key={t.id} className="p-4 rounded-xl border border-campus-border bg-campus-elevated/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-campus-text">{t.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {t.members.length} / {t.maxMembers} Members
                        </span>
                      </div>
                      <p className="text-[11px] text-campus-text-muted line-clamp-2">{t.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {t.desiredSkills.slice(0, 3).map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-campus-surface text-campus-text-dim border border-campus-border-subtle">
                            Looking for: {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Reservation / Ticket Card */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-campus-border bg-campus-surface p-6 shadow-card space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-campus-text">
              Registration Desk
            </h3>

            {/* Capacity Meter */}
            <div className="space-y-2 p-4 rounded-xl bg-campus-elevated/50 border border-campus-border-subtle">
              <div className="flex items-center justify-between text-xs font-medium text-campus-text-muted">
                <span>Seat Capacity</span>
                <span className="font-bold text-campus-text">
                  {event.confirmedCount} / {event.capacity} Confirmed
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-campus-border-subtle overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFull ? 'bg-rose-500' : 'bg-blue-600 dark:bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((event.confirmedCount / event.capacity) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={isFull ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                  {isFull ? 'Capacity Reached' : `${event.availableSeats} seats remaining`}
                </span>
                {event.waitlistCount > 0 && (
                  <span className="text-campus-text-dim">
                    {event.waitlistCount} on waitlist
                  </span>
                )}
              </div>
            </div>

            {/* Deadline status */}
            <div className="text-xs text-campus-text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-campus-cobalt shrink-0" />
              <span>Deadline: {deadline.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Action State Buttons */}
            {isRegistered ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-center space-y-1">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Confirmed Attendee
                  </p>
                  <p className="text-[11px] font-mono text-campus-text-muted">
                    Ticket Code: {event.userRegistration?.ticketCode}
                  </p>
                </div>

                {event.userRegistration?.ticketCode && (
                  <Link
                    to={`/tickets/${event.userRegistration.ticketCode}`}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs bg-campus-cobalt text-white flex items-center justify-center gap-2 shadow-sm hover:bg-campus-cobalt-hover transition-colors"
                  >
                    <QrCode className="w-4 h-4" /> View QR Boarding Pass
                  </Link>
                )}

                <button
                  onClick={handleCancelRegistration}
                  disabled={actionLoading}
                  className="w-full py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-200"
                >
                  {actionLoading ? 'Processing...' : 'Cancel Registration'}
                </button>
              </div>
            ) : isWaitlisted ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                    On Waitlist &bull; Position #{event.userWaitlist?.position}
                  </p>
                  <p className="text-[11px] text-campus-text-muted">
                    You will be promoted automatically if a registered attendee cancels!
                  </p>
                </div>

                <button
                  onClick={handleLeaveWaitlist}
                  disabled={actionLoading}
                  className="w-full py-2 rounded-xl text-xs font-medium text-campus-text-muted hover:text-campus-text border border-campus-border bg-campus-surface transition-colors"
                >
                  Leave Waitlist
                </button>
              </div>
            ) : isFull ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-200 font-medium text-center">
                  All seats currently reserved. Join the automated smart waitlist to claim cancelled seats.
                </div>

                <button
                  onClick={handleJoinWaitlist}
                  disabled={actionLoading || isPastDeadline}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-600 text-white shadow-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Joining...' : 'Join Automated Waitlist'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleRegister}
                  disabled={actionLoading || isPastDeadline}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-campus-cobalt text-white shadow-md hover:bg-campus-cobalt-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? 'Securing Seat...' : 'Claim Registration & QR Pass'}
                </button>

                {!isAuthenticated && (
                  <p className="text-[11px] text-center text-campus-text-dim">
                    Already an SRMIST student? <Link to="/login" className="text-campus-cobalt font-semibold hover:underline">Log in</Link> to register instantly.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
