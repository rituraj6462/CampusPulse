import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TeamItem, EventItem } from '@campuspulse/shared';
import {
  Users,
  Plus,
  Sparkles,
  Check,
  X,
  Send,
  LogOut,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeamUpPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [hackathons, setHackathons] = useState<EventItem[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Team creation modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamMax, setNewTeamMax] = useState(4);
  const [newTeamDesired, setNewTeamDesired] = useState('Python, UI/UX, PyTorch');
  const [newTeamOffered, setNewTeamOffered] = useState('React, TypeScript');
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // Join request modal state
  const [joinModalTeam, setJoinModalTeam] = useState<TeamItem | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [joinSkills, setJoinSkills] = useState('React, CSS, Figma');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadHackathons = async () => {
    try {
      const res = await api.get<{ success: boolean; data: EventItem[] }>('/events?hackathonOnly=true');
      if (res.success && res.data.length > 0) {
        setHackathons(res.data);
        setSelectedHackathonId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load hackathons', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async (eventId: string) => {
    if (!eventId) return;
    try {
      const res = await api.get<{ success: boolean; data: TeamItem[] }>(`/events/${eventId}/teams`);
      if (res.success) {
        setTeams(res.data);
      }
    } catch (err) {
      console.error('Failed to load teams', err);
    }
  };

  useEffect(() => {
    loadHackathons();
  }, []);

  useEffect(() => {
    if (selectedHackathonId) {
      loadTeams(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHackathonId) return;
    setSubmittingTeam(true);
    setFeedbackMessage(null);

    try {
      const desired = newTeamDesired.split(',').map(s => s.trim()).filter(Boolean);
      const offered = newTeamOffered.split(',').map(s => s.trim()).filter(Boolean);

      await api.post('/teams', {
        eventId: selectedHackathonId,
        name: newTeamName,
        description: newTeamDescription,
        maxMembers: Number(newTeamMax),
        desiredSkills: desired,
        offeredSkills: offered
      });

      setFeedbackMessage({ type: 'success', text: 'Team successfully founded! You are the leader.' });
      setCreateModalOpen(false);
      setNewTeamName('');
      setNewTeamDescription('');
      await loadTeams(selectedHackathonId);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to create team.' });
    } finally {
      setSubmittingTeam(false);
    }
  };

  const handleSendJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinModalTeam) return;
    setSubmittingJoin(true);
    setFeedbackMessage(null);

    try {
      const skills = joinSkills.split(',').map(s => s.trim()).filter(Boolean);
      await api.post(`/teams/${joinModalTeam.id}/request`, {
        message: joinMessage,
        skills
      });

      setFeedbackMessage({ type: 'success', text: `Join request sent to ${joinModalTeam.name} leader!` });
      setJoinModalTeam(null);
      setJoinMessage('');
      await loadTeams(selectedHackathonId);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to send request.' });
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handleRespondRequest = async (teamId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.post(`/teams/${teamId}/requests/${requestId}/respond`, { status });
      setFeedbackMessage({ type: 'success', text: `Applicant request ${status.toLowerCase()}!` });
      await loadTeams(selectedHackathonId);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to update request.' });
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      await api.post(`/teams/${teamId}/leave`);
      setFeedbackMessage({ type: 'success', text: 'You have left the team.' });
      await loadTeams(selectedHackathonId);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to leave team.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-campus-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <Users className="w-3.5 h-3.5" /> Hackathon Team Formation Hub
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-campus-text">
            Team Up &bull; HackSRM Rosters
          </h1>
          <p className="text-xs sm:text-sm text-campus-text-muted">
            Find teammates with complementary technical skills, build project rosters, and apply to open teams.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-campus-cobalt text-white shadow-md hover:bg-campus-cobalt-hover transition-colors"
          >
            <Plus className="w-4 h-4" /> Create New Team
          </button>
        )}
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-500/30'
        }`}>
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)}>&times;</button>
        </div>
      )}

      {/* Hackathon Selector */}
      {hackathons.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-campus-text-dim uppercase tracking-wider">Select Hackathon:</span>
          <div className="flex flex-wrap gap-2">
            {hackathons.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHackathonId(h.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedHackathonId === h.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'border border-campus-border bg-campus-surface text-campus-text-muted hover:bg-campus-elevated'
                }`}
              >
                {h.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-campus-elevated animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campus-border p-12 text-center space-y-3 bg-campus-surface">
          <p className="text-base font-bold text-campus-text">No teams formed yet for this hackathon</p>
          <p className="text-xs text-campus-text-muted">Take the lead! Register for the hackathon and create the first team.</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-campus-cobalt text-white text-xs font-semibold"
          >
            Create Team Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => {
            const isLeader = team.leaderId === user?.id;
            const isMember = team.isUserMember;
            const isFull = team.members.length >= team.maxMembers;

            return (
              <div
                key={team.id}
                className="rounded-2xl border border-campus-border bg-campus-surface p-6 shadow-subtle flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  {/* Team Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-campus-text">{team.name}</h3>
                      <p className="text-[11px] text-campus-text-dim">Led by {team.leader.name} &bull; {team.leader.department}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isFull
                        ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    }`}>
                      {team.members.length} / {team.maxMembers} Members
                    </span>
                  </div>

                  <p className="text-xs text-campus-text-muted leading-relaxed">
                    {team.description}
                  </p>

                  {/* Skills Grid */}
                  <div className="space-y-2 pt-2 border-t border-campus-border-subtle">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-campus-text-dim">Seeking Skills:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {team.desiredSkills.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-campus-text-dim">Offered by Roster:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {team.offeredSkills.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Existing Roster */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-campus-text-dim mb-1">Roster Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {team.members.map((m) => (
                        <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-campus-elevated text-xs font-semibold text-campus-text">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{m.user.name}</span>
                          {m.role === 'LEADER' && <span className="text-[10px] text-campus-cobalt font-bold">(Leader)</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leader Application Management Panel */}
                  {isLeader && team.joinRequests && team.joinRequests.length > 0 && (
                    <div className="p-3.5 rounded-xl border border-campus-cobalt/30 bg-blue-50/50 dark:bg-blue-950/20 space-y-2 mt-2">
                      <p className="text-xs font-bold text-campus-text flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-campus-cobalt" /> Pending Membership Applications ({team.joinRequests.filter(r => r.status === 'PENDING').length})
                      </p>
                      <div className="space-y-2">
                        {team.joinRequests.filter(r => r.status === 'PENDING').map((req) => (
                          <div key={req.id} className="p-2.5 rounded-lg bg-campus-surface border border-campus-border flex items-center justify-between gap-3 text-xs">
                            <div>
                              <p className="font-bold text-campus-text">{req.user.name}</p>
                              <p className="text-[11px] text-campus-text-muted">{req.message || 'No note attached'}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleRespondRequest(team.id, req.id, 'ACCEPTED')}
                                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                title="Accept Member"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRespondRequest(team.id, req.id, 'REJECTED')}
                                className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-campus-border-subtle flex items-center justify-between">
                  {isMember ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> You are on this roster
                      </span>
                      {!isLeader && (
                        <button
                          onClick={() => handleLeaveTeam(team.id)}
                          className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Leave Team
                        </button>
                      )}
                    </div>
                  ) : team.userRequestStatus === 'PENDING' ? (
                    <span className="text-xs font-bold text-amber-600">
                      Join Request Pending Approval
                    </span>
                  ) : isFull ? (
                    <span className="text-xs text-campus-text-dim font-medium">
                      Roster Full
                    </span>
                  ) : (
                    <button
                      onClick={() => setJoinModalTeam(team)}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-campus-cobalt text-white shadow-sm hover:bg-campus-cobalt-hover transition-colors"
                    >
                      Request to Join Team
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Team */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-campus-border bg-campus-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <h3 className="text-base font-bold text-campus-text">Form a New Hackathon Team</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-campus-text-dim hover:text-campus-text">&times;</button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-campus-text mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. QuantumBuilders, NeuralDevs"
                  className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-xs text-campus-text focus:outline-none focus:border-campus-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-campus-text mb-1">Project Idea &amp; Focus</label>
                <textarea
                  required
                  rows={3}
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="What are you aiming to build? Track or concept overview..."
                  className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-xs text-campus-text focus:outline-none focus:border-campus-cobalt"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-campus-text mb-1">Max Roster Size</label>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={newTeamMax}
                    onChange={(e) => setNewTeamMax(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-xs text-campus-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-campus-text mb-1">Offered Skills</label>
                  <input
                    type="text"
                    value={newTeamOffered}
                    onChange={(e) => setNewTeamOffered(e.target.value)}
                    placeholder="Comma separated"
                    className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-xs text-campus-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-campus-text mb-1">Desired Teammate Skills</label>
                <input
                  type="text"
                  value={newTeamDesired}
                  onChange={(e) => setNewTeamDesired(e.target.value)}
                  placeholder="e.g. Python, Machine Learning, UI/UX"
                  className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-xs text-campus-text"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-campus-text-muted hover:text-campus-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTeam}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-campus-cobalt text-white shadow-sm hover:bg-campus-cobalt-hover"
                >
                  {submittingTeam ? 'Founding...' : 'Found Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request to Join */}
      {joinModalTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-campus-border bg-campus-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <h3 className="text-base font-bold text-campus-text">Join "{joinModalTeam.name}"</h3>
              <button onClick={() => setJoinModalTeam(null)} className="text-campus-text-dim hover:text-campus-text">&times;</button>
            </div>

            <form onSubmit={handleSendJoinRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-campus-text mb-1">Note to Team Leader</label>
                <textarea
                  rows={3}
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Introduce yourself and explain how you can contribute..."
                  className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-xs text-campus-text focus:outline-none focus:border-campus-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-campus-text mb-1">Your Key Skills (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={joinSkills}
                  onChange={(e) => setJoinSkills(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-campus-border bg-campus-elevated text-xs text-campus-text"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinModalTeam(null)}
                  className="px-4 py-2 text-xs font-medium text-campus-text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJoin}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-campus-cobalt text-white shadow-sm"
                >
                  {submittingJoin ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
