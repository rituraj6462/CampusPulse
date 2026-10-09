import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  OrganizerAnalyticsSummary,
  EventItem,
  RegistrationItem,
  Role,
  CAMPUS_INTERESTS
} from '@campuspulse/shared';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  ShieldCheck,
  Plus,
  Users,
  QrCode,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Layers,
  Check,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OrganizerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<OrganizerAnalyticsSummary | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [participants, setParticipants] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Participant search & filter
  const [searchParticipant, setSearchParticipant] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Scanner & Check-in Desk State
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState<{
    success: boolean;
    message: string;
    duplicate?: boolean;
    attendee?: any;
  } | null>(null);

  // Event Creation Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newShortDesc, setNewShortDesc] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Workshops & Seminars');
  const [newVenue, setNewVenue] = useState('Tech Park Audi, SRMIST');
  const [newCapacity, setNewCapacity] = useState(60);
  const [newIsHackathon, setNewIsHackathon] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [submittingEvent, setSubmittingEvent] = useState(false);

  const loadData = async () => {
    try {
      const [analyticsRes, eventsRes] = await Promise.all([
        api.get<{ success: boolean; data: OrganizerAnalyticsSummary }>('/organizer/analytics'),
        api.get<{ success: boolean; data: EventItem[] }>('/events?limit=50')
      ]);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (eventsRes.success && eventsRes.data.length > 0) {
        setEvents(eventsRes.data);
        if (!selectedEventId) {
          setSelectedEventId(eventsRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load organizer analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (eventId: string) => {
    if (!eventId) return;
    try {
      const query = new URLSearchParams();
      if (searchParticipant) query.set('search', searchParticipant);
      if (statusFilter) query.set('status', statusFilter);

      const res = await api.get<{ success: boolean; data: RegistrationItem[] }>(
        `/organizer/events/${eventId}/participants?${query.toString()}`
      );
      if (res.success) {
        setParticipants(res.data);
      }
    } catch (err) {
      console.error('Failed to load participants', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadParticipants(selectedEventId);
    }
  }, [selectedEventId, searchParticipant, statusFilter]);

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInCode.trim() || !selectedEventId) return;

    setCheckInLoading(true);
    setCheckInFeedback(null);

    try {
      const res = await api.post<{
        success: boolean;
        message: string;
        attendee: any;
        checkedInAt: string;
      }>('/tickets/check-in', {
        ticketCode: checkInCode.trim().toUpperCase(),
        eventId: selectedEventId
      });

      setCheckInFeedback({
        success: true,
        message: res.message,
        attendee: res.attendee
      });
      setCheckInCode('');
      await loadParticipants(selectedEventId);
      await loadData();
    } catch (err: any) {
      setCheckInFeedback({
        success: false,
        message: err.message || 'Check-in validation failed.',
        duplicate: err.details?.duplicate
      });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (!selectedEventId) return;
    try {
      const csvData = await api.get<string>(`/organizer/events/${selectedEventId}/export-csv`);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${selectedEventId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEvent(true);
    try {
      await api.post('/events', {
        title: newTitle,
        shortDescription: newShortDesc,
        description: newDesc,
        category: newCategory,
        venue: newVenue,
        capacity: Number(newCapacity),
        isHackathon: newIsHackathon,
        startDate: new Date(newStartDate).toISOString(),
        endDate: new Date(newEndDate).toISOString(),
        registrationDeadline: new Date(newDeadline).toISOString(),
        tags: [newCategory, 'SRMIST', 'ACM']
      });

      setCreateModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish event.');
    } finally {
      setSubmittingEvent(false);
    }
  };

  if (user?.role !== Role.ORGANIZER && user?.role !== Role.ADMIN) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-campus-text">Organizer Privileges Required</h2>
        <p className="text-xs text-campus-text-muted">
          Your account does not have organizer authorization. Please log in with an authorized chapter lead account.
        </p>
        <Link to="/login" className="inline-block px-4 py-2 rounded-lg bg-campus-cobalt text-white text-xs font-semibold">
          Switch to Organizer Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-campus-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5" /> ACM Organizer Operations &bull; SRMIST
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-campus-text">
            Organizer Command Center
          </h1>
          <p className="text-xs sm:text-sm text-campus-text-muted">
            Inspect real-time registration trends, launch new events, validate attendee passes, and export verified records.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-campus-cobalt text-white shadow-md hover:bg-campus-cobalt-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> Publish New Event
        </button>
      </div>

      {/* Aggregate KPI Stat Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl border border-campus-border bg-campus-surface shadow-subtle space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-campus-text-dim">Published Events</p>
            <p className="text-2xl font-black text-campus-text">{analytics.publishedEvents}</p>
            <p className="text-[10px] text-campus-text-muted">Total managed: {analytics.totalEvents}</p>
          </div>

          <div className="p-5 rounded-2xl border border-campus-border bg-campus-surface shadow-subtle space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-campus-text-dim">Active Registrations</p>
            <p className="text-2xl font-black text-campus-cobalt">{analytics.totalRegistrations}</p>
            <p className="text-[10px] text-campus-text-muted">Confirmed students</p>
          </div>

          <div className="p-5 rounded-2xl border border-campus-border bg-campus-surface shadow-subtle space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-campus-text-dim">Capacity Utilization</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {analytics.averageCapacityUtilization}%
            </p>
            <p className="text-[10px] text-campus-text-muted">Across all campus venues</p>
          </div>

          <div className="p-5 rounded-2xl border border-campus-border bg-campus-surface shadow-subtle space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-campus-text-dim">Attendance Rate</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {analytics.overallAttendanceRate}%
            </p>
            <p className="text-[10px] text-campus-text-muted">{analytics.totalAttendees} verified check-ins</p>
          </div>

          <div className="p-5 rounded-2xl border border-campus-border bg-campus-surface shadow-subtle space-y-1 col-span-2 lg:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-campus-text-dim">Waitlist Queue</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {analytics.waitlistSizeTotal}
            </p>
            <p className="text-[10px] text-campus-text-muted">Students waiting for seats</p>
          </div>
        </div>
      )}

      {/* Chart: Registration Trends */}
      {analytics && (
        <div className="rounded-2xl border border-campus-border bg-campus-surface p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-campus-text flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-campus-cobalt" />
              14-Day Registration Velocity
            </h3>
            <span className="text-xs text-campus-text-dim font-medium">Daily student registrations</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.recentRegistrationsTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--cp-surface)',
                    borderColor: 'var(--cp-border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="var(--cp-cobalt)" radius={[4, 4, 0, 0]} name="Registrations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Interactive QR Check-In Desk */}
      <div className="rounded-2xl border-2 border-campus-cobalt/40 bg-campus-surface p-6 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-campus-text">Event Entry &amp; Check-In Desk</h2>
              <p className="text-xs text-campus-text-muted">Validate QR codes or lookup ticket identifiers with atomic duplicate prevention.</p>
            </div>
          </div>

          {/* Select Target Event */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-campus-text-dim">Target Event:</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-campus-border bg-campus-elevated text-xs font-semibold text-campus-text focus:outline-none focus:border-campus-cobalt"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Form for Manual Scanner or Handheld Reader */}
        <form onSubmit={handleCheckInSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={checkInCode}
              onChange={(e) => setCheckInCode(e.target.value)}
              placeholder="Scan QR payload or enter ticket code (e.g. CP-HACKSRM-8F4C2)..."
              className="w-full px-4 py-3 rounded-xl border-2 border-campus-border bg-campus-elevated text-sm font-mono text-campus-text focus:outline-none focus:border-campus-cobalt uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={checkInLoading || !checkInCode.trim()}
            className="px-6 py-3 rounded-xl font-bold text-xs bg-campus-cobalt text-white shadow-md hover:bg-campus-cobalt-hover transition-colors disabled:opacity-50 shrink-0"
          >
            {checkInLoading ? 'Verifying...' : 'Validate & Check In'}
          </button>
        </form>

        {/* Visual Check-In Feedback */}
        {checkInFeedback && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-3 animate-in fade-in ${
              checkInFeedback.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-800 dark:text-rose-200'
            }`}
          >
            {checkInFeedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1">
              <p className="font-bold text-sm">
                {checkInFeedback.success ? 'Verified Check-In Granted!' : 'Validation Warning'}
              </p>
              <p>{checkInFeedback.message}</p>
              {checkInFeedback.attendee && (
                <p className="text-[11px] opacity-90">
                  Attendee: {checkInFeedback.attendee.name} &bull; {checkInFeedback.attendee.department || 'Student'} &bull; {checkInFeedback.attendee.email}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Participant Roster & CSV Export Section */}
      <div className="rounded-2xl border border-campus-border bg-campus-surface p-6 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-campus-text flex items-center gap-2">
              <Users className="w-4 h-4 text-campus-cobalt" />
              Participant Roster ({participants.length})
            </h3>
            <p className="text-xs text-campus-text-muted">Real-time database records for the selected event.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-campus-text-dim" />
              <input
                type="text"
                value={searchParticipant}
                onChange={(e) => setSearchParticipant(e.target.value)}
                placeholder="Search attendee..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-campus-border bg-campus-elevated text-xs text-campus-text focus:outline-none"
              />
            </div>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-campus-elevated border border-campus-border text-campus-text hover:border-campus-cobalt transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-campus-elevated text-campus-text-dim uppercase text-[10px] tracking-wider border-y border-campus-border">
              <tr>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Ticket Pass</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Checked In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campus-border-subtle">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-campus-text-muted">
                    No matching participant records found.
                  </td>
                </tr>
              ) : (
                participants.map((p) => {
                  const isChecked = !!p.ticket?.attendance;

                  return (
                    <tr key={p.id} className="hover:bg-campus-elevated/40">
                      <td className="py-3 px-4 font-bold text-campus-text">{p.user?.name}</td>
                      <td className="py-3 px-4 text-campus-text-muted">{p.user?.email}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-campus-cobalt">
                        {p.ticket?.ticketCode || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'CONFIRMED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : p.status === 'ATTENDED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isChecked ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Checked In
                          </span>
                        ) : (
                          <span className="text-campus-text-dim">Pending Entry</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Publish Event */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-campus-border bg-campus-surface p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <h3 className="text-base font-bold text-campus-text">Publish New Campus Event</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-campus-text-dim hover:text-campus-text">&times;</button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-campus-text mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. NextGen WebCraft Masterclass"
                  className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-campus-text focus:outline-none focus:border-campus-cobalt"
                />
              </div>

              <div>
                <label className="block font-semibold text-campus-text mb-1">Short Summary (1-2 sentences)</label>
                <input
                  type="text"
                  required
                  value={newShortDesc}
                  onChange={(e) => setNewShortDesc(e.target.value)}
                  placeholder="Brief pitch for event cards..."
                  className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-campus-text"
                />
              </div>

              <div>
                <label className="block font-semibold text-campus-text mb-1">Full Description</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Comprehensive event details, syllabus, prerequisites..."
                  className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-campus-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-campus-text mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-campus-text"
                  >
                    <option value="Workshops & Seminars">Workshops & Seminars</option>
                    <option value="Hackathons & Competitions">Hackathons & Competitions</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="Competitive Programming">Competitive Programming</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-campus-text mb-1">Seat Capacity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-campus-text"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-campus-text mb-1">Campus Venue / Hall</label>
                <input
                  type="text"
                  required
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder="e.g. Dr. T.P. Ganesan Auditorium"
                  className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-campus-text"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-campus-text mb-1">Start Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-campus-border bg-campus-elevated text-campus-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-campus-text mb-1">End Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-campus-border bg-campus-elevated text-campus-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-campus-text mb-1">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-campus-border bg-campus-elevated text-campus-text"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hackathonCheckbox"
                  checked={newIsHackathon}
                  onChange={(e) => setNewIsHackathon(e.target.checked)}
                  className="rounded text-campus-cobalt"
                />
                <label htmlFor="hackathonCheckbox" className="font-semibold text-campus-text cursor-pointer">
                  Enable Team Up Hackathon Roster formation
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-campus-border">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-campus-text-muted hover:text-campus-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEvent}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-campus-cobalt text-white shadow-sm hover:bg-campus-cobalt-hover"
                >
                  {submittingEvent ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
