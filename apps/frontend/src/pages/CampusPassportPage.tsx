import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PassportProfile, BadgeType } from '@campuspulse/shared';
import {
  Trophy,
  Sparkles,
  Compass,
  Flame,
  Cpu,
  CheckCircle2,
  Lock,
  Globe,
  Share2,
  Calendar,
  AlertTriangle,
  Copy
} from 'lucide-react';

export const CampusPassportPage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PassportProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const isOwner = !userId || (user && user.id === userId);

  const loadPassport = async () => {
    setLoading(true);
    try {
      const endpoint = isOwner ? '/passport/me' : `/passport/user/${userId}`;
      const res = await api.get<{ success: boolean; data: PassportProfile }>(endpoint);
      if (res.success) {
        setProfile(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Passport profile could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassport();
  }, [userId, isOwner, user?.id]);

  const handleTogglePrivacy = async () => {
    if (!profile || !isOwner) return;
    const newStatus = !profile.user.isPassportPublic;
    try {
      await api.put('/passport/privacy', { isPassportPublic: newStatus });
      setProfile({
        ...profile,
        user: { ...profile.user, isPassportPublic: newStatus }
      });
    } catch (err) {
      console.error('Failed to update privacy', err);
    }
  };

  const handleCopyLink = () => {
    if (!profile) return;
    const url = `${window.location.origin}/passport/${profile.user.id}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const getBadgeIcon = (type: BadgeType) => {
    switch (type) {
      case BadgeType.FIRST_PULSE:
        return <Sparkles className="w-6 h-6 text-amber-500" />;
      case BadgeType.WORKSHOP_EXPLORER:
        return <Compass className="w-6 h-6 text-blue-500" />;
      case BadgeType.HACKATHON_HERO:
        return <Trophy className="w-6 h-6 text-purple-500" />;
      case BadgeType.CAMPUS_REGULAR:
        return <Flame className="w-6 h-6 text-rose-500" />;
      case BadgeType.TECH_PIONEER:
        return <Cpu className="w-6 h-6 text-emerald-500" />;
      default:
        return <Trophy className="w-6 h-6 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-44 rounded-3xl bg-campus-elevated" />
        <div className="h-64 rounded-3xl bg-campus-elevated" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-campus-text">Passport Unavailable</h2>
        <p className="text-xs text-campus-text-muted">{error || 'This user has made their Campus Passport private.'}</p>
        <Link to="/events" className="inline-block px-4 py-2 rounded-lg bg-campus-cobalt text-white text-xs font-semibold">
          Return to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Passport Identity Header */}
      <div className="rounded-3xl border-2 border-campus-border bg-campus-surface p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-campus-cobalt text-white flex items-center justify-center text-xl font-bold shadow-md overflow-hidden">
            {profile.user.avatar ? (
              <img src={profile.user.avatar} alt={profile.user.name} className="w-full h-full object-cover" />
            ) : (
              profile.user.name.charAt(0)
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-campus-text">{profile.user.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                VERIFIED STUDENT
              </span>
            </div>
            <p className="text-xs text-campus-text-muted">
              {profile.user.department || 'SRMIST Student'} &bull; {profile.user.bio || 'Campus Builder & ACM Member'}
            </p>
          </div>
        </div>

        {/* Attendance Stamp Counter */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-campus-elevated border border-campus-border text-center">
            <p className="text-2xl font-black text-campus-text">{profile.verifiedAttendanceCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-campus-text-dim">Verified Stamps</p>
          </div>

          {isOwner && (
            <div className="space-y-2">
              <button
                onClick={handleTogglePrivacy}
                className={`w-full px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                  profile.user.isPassportPublic
                    ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                    : 'border-campus-border bg-campus-elevated text-campus-text-muted'
                }`}
              >
                {profile.user.isPassportPublic ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-600" /> Public Profile
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Private Profile
                  </>
                )}
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-campus-border bg-campus-surface text-campus-text hover:bg-campus-elevated transition-colors flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> {copySuccess ? 'Link Copied!' : 'Share Passport'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold tracking-tight text-campus-text flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Earned Achievement Badges ({profile.achievements.length})
          </h2>
          <p className="text-xs text-campus-text-muted">
            Badges are cryptographically stamped onto your passport when an organizer verifies your QR attendance pass.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {profile.milestones.map((m) => {
            const isUnlocked = m.unlocked;

            return (
              <div
                key={m.badgeType}
                className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all duration-150 ${
                  isUnlocked
                    ? 'border-campus-border bg-campus-surface shadow-subtle'
                    : 'border-campus-border-subtle bg-campus-elevated/40 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-xl border ${
                    isUnlocked
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40'
                      : 'bg-campus-elevated border-campus-border text-campus-text-dim'
                  }`}>
                    {getBadgeIcon(m.badgeType)}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-campus-text">{m.title}</h3>
                      {isUnlocked && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          UNLOCKED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-campus-text-muted leading-relaxed">{m.description}</p>
                  </div>
                </div>

                {/* Milestone progress bar */}
                <div className="space-y-1.5 pt-2 border-t border-campus-border-subtle">
                  <div className="flex items-center justify-between text-[11px] font-medium text-campus-text-muted">
                    <span>{m.current} of {m.threshold} verified events</span>
                    <span className="font-bold text-campus-text">{m.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-campus-border-subtle overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isUnlocked ? 'bg-amber-500' : 'bg-campus-cobalt'
                      }`}
                      style={{ width: `${m.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Attendance Passport Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-campus-text flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Verified Event Attendance Stamps ({profile.recentEvents.length})
        </h2>

        {profile.recentEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-campus-border p-8 text-center text-xs text-campus-text-muted bg-campus-surface">
            No verified attendance stamps on record yet. Register for an upcoming event and check in with your QR pass!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="rounded-2xl border border-campus-border bg-campus-surface p-5 shadow-subtle flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {evt.category}
                  </span>
                  <h4 className="text-sm font-bold text-campus-text">{evt.title}</h4>
                  <p className="text-xs text-campus-text-muted">{evt.venue}</p>
                  <p className="text-[10px] text-campus-text-dim">
                    Checked in: {new Date(evt.attendedAt).toLocaleString()}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-full border-2 border-emerald-500/50 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
