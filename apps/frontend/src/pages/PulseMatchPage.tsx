import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PulseMatchRecommendation, CAMPUS_INTERESTS } from '@campuspulse/shared';
import {
  Sparkles,
  Calendar,
  MapPin,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Settings,
  HelpCircle
} from 'lucide-react';

export const PulseMatchPage: React.FC = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [recommendations, setRecommendations] = useState<PulseMatchRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Preference edit modal state
  const [editInterestsOpen, setEditInterestsOpen] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>(user?.interests || []);
  const [savingInterests, setSavingInterests] = useState(false);

  useEffect(() => {
    if (user?.interests) {
      setUserInterests(user.interests);
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: PulseMatchRecommendation[] }>('/pulse-match/recommendations');
      if (res.success) {
        setRecommendations(res.data);
      }
    } catch (err) {
      console.error('Failed to load Pulse Match recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [isAuthenticated, user?.interests]);

  const toggleInterest = (interest: string) => {
    if (userInterests.includes(interest)) {
      setUserInterests(userInterests.filter(i => i !== interest));
    } else {
      setUserInterests([...userInterests, interest]);
    }
  };

  const handleSavePreferences = async () => {
    setSavingInterests(true);
    try {
      await api.put('/auth/profile', { interests: userInterests });
      await refreshUser();
      setEditInterestsOpen(false);
    } catch (err) {
      console.error('Failed to update preferences', err);
    } finally {
      setSavingInterests(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-campus-text">Pulse Match Personalized Discovery</h2>
        <p className="text-xs text-campus-text-muted leading-relaxed">
          Log in with your SRMIST student account to calculate your custom match scores across upcoming workshops, hackathons, and symposiums.
        </p>
        <Link to="/login" className="inline-block px-5 py-2.5 rounded-xl bg-campus-cobalt text-white text-xs font-semibold shadow-md">
          Log In to See Recommendations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-campus-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Sparkles className="w-3.5 h-3.5" /> Deterministic Scoring Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-campus-text">
            Pulse Match For You
          </h1>
          <p className="text-xs sm:text-sm text-campus-text-muted">
            Transparently scored and ranked based on your selected interests ({user?.interests?.join(', ') || 'General'}).
          </p>
        </div>

        <button
          onClick={() => setEditInterestsOpen(!editInterestsOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-campus-border bg-campus-surface text-campus-text hover:bg-campus-elevated transition-colors"
        >
          <Settings className="w-4 h-4 text-campus-cobalt" />
          Edit My Interests
        </button>
      </div>

      {/* Preferences Drawer */}
      {editInterestsOpen && (
        <div className="p-6 rounded-2xl border border-campus-cobalt/30 bg-campus-surface shadow-lg space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-campus-text">Update Your Interests</h3>
            <span className="text-xs text-campus-text-dim">Changes will recalculate your recommendation scores</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {CAMPUS_INTERESTS.map((interest) => {
              const active = userInterests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setEditInterestsOpen(false)}
              className="px-3 py-1.5 text-xs text-campus-text-muted hover:text-campus-text"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePreferences}
              disabled={savingInterests}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-campus-cobalt text-white shadow-sm"
            >
              {savingInterests ? 'Recalculating...' : 'Save & Refresh Scores'}
            </button>
          </div>
        </div>
      )}

      {/* Recommendations Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-campus-elevated animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campus-border p-12 text-center space-y-3 bg-campus-surface">
          <p className="text-sm font-bold text-campus-text">No recommendations available</p>
          <p className="text-xs text-campus-text-muted">You may already be registered for all eligible upcoming events!</p>
          <Link to="/events" className="inline-block px-4 py-2 text-xs font-semibold rounded-lg bg-campus-cobalt text-white">
            Browse All Events
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec, index) => (
            <div
              key={rec.event.id}
              className="rounded-2xl border border-campus-border bg-campus-surface p-6 card-hover-effect shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                {/* Score Pill & Rank */}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-black bg-blue-600 text-white flex items-center gap-1 shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5" /> {rec.score} pts
                  </span>
                  <span className="text-xs font-bold text-campus-text-dim">
                    #{index + 1} Best Match
                  </span>
                  <span className="text-xs text-campus-text-dim">&bull;</span>
                  <span className="text-xs font-medium text-campus-text-dim">
                    {rec.event.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-campus-text hover:text-campus-cobalt transition-colors">
                  <Link to={`/events/${rec.event.slug}`}>
                    {rec.event.title}
                  </Link>
                </h3>

                <p className="text-xs text-campus-text-muted line-clamp-2">
                  {rec.event.shortDescription}
                </p>

                {/* Transparent Match Reasons List */}
                <div className="p-3 rounded-xl bg-campus-elevated/70 border border-campus-border-subtle space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-campus-text-dim">
                    Why this was recommended:
                  </p>
                  <ul className="space-y-0.5">
                    {rec.matchReasons.map((reason, idx) => (
                      <li key={idx} className="text-[11px] text-campus-text-muted flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action */}
              <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto">
                <div className="text-right text-xs text-campus-text-muted hidden md:block">
                  <p className="font-semibold text-campus-text">{rec.event.venue}</p>
                  <p className="text-[11px]">{new Date(rec.event.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                </div>

                <Link
                  to={`/events/${rec.event.slug}`}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-campus-cobalt text-white shadow-sm hover:bg-campus-cobalt-hover transition-colors"
                >
                  View &amp; Register <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
