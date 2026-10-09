import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { EventItem } from '@campuspulse/shared';
import { EventCard } from '../components/EventCard';
import {
  Sparkles,
  Compass,
  Users,
  Trophy,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck2
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [featuredEvent, setFeaturedEvent] = useState<EventItem | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await api.get<{ success: boolean; data: EventItem[] }>('/events?limit=7');
        if (res.success && res.data.length > 0) {
          setFeaturedEvent(res.data[0]);
          setUpcomingEvents(res.data.slice(1, 7));
        }
      } catch (err) {
        console.error('Failed to fetch events for landing page', err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* 1. Hero Section — Editorial Elegance */}
      <section className="relative pt-12 sm:pt-20 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-campus-border bg-campus-surface shadow-subtle">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-semibold text-campus-text-muted">
                  Official Event Platform &bull; ACM Student Chapter SRMIST
                </span>
              </div>

              {/* Editorial Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-campus-text leading-[1.12]">
                Find your crowd.{' '}
                <span className="font-serif italic font-normal text-campus-cobalt block mt-1">
                  Build your campus story.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-campus-text-muted max-w-xl leading-relaxed">
                CampusPulse transforms university engagement through transparent interest-matching, concurrency-safe reservations, hackathon team formation, and verified digital credentials.
              </p>

              {/* CTA Group */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-campus-cobalt text-white shadow-md hover:bg-campus-cobalt-hover hover:gap-3 transition-all duration-150"
                >
                  <Compass className="w-4 h-4" />
                  Explore Campus Events
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/pulse-match"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border border-campus-border bg-campus-surface text-campus-text hover:bg-campus-elevated transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-campus-cobalt" />
                  Try Pulse Match
                </Link>
              </div>

              {/* Trust & Engineering Pillars */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-campus-border-subtle max-w-lg">
                <div>
                  <p className="text-2xl font-extrabold text-campus-text">100%</p>
                  <p className="text-xs text-campus-text-dim font-medium">ACID Concurrency Safe</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-campus-text">Zero</p>
                  <p className="text-xs text-campus-text-dim font-medium">Seat Overbooking</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-campus-text">5+ Badges</p>
                  <p className="text-xs text-campus-text-dim font-medium">Verified Passport</p>
                </div>
              </div>
            </div>

            {/* Asymmetric Featured Hero Showcase */}
            <div className="lg:col-span-5">
              {featuredEvent ? (
                <div className="relative">
                  <div className="absolute -top-3 -left-3 px-3 py-1 rounded-md bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider z-20 shadow-md">
                    Featured Spotlight
                  </div>
                  <EventCard event={featuredEvent} />
                </div>
              ) : (
                <div className="h-96 rounded-2xl border border-campus-border bg-campus-elevated animate-pulse flex items-center justify-center text-campus-text-dim text-sm">
                  Loading featured campus event...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Distinctive Feature Highlights Trio */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-campus-cobalt">
            Distinctive Engineering
          </h2>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-campus-text">
            Built for how modern students actually connect
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Pulse Match */}
          <div className="rounded-2xl border border-campus-border bg-campus-surface p-6 space-y-4 card-hover-effect">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-campus-text">Pulse Match Discovery</h3>
            <p className="text-xs text-campus-text-muted leading-relaxed">
              Transparent, deterministic recommendation engine that scores upcoming hackathons, tech sprints, and workshops against student interests with explicit point explanations.
            </p>
            <Link
              to="/pulse-match"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-campus-cobalt hover:underline pt-2"
            >
              See your recommendations <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Feature 2: Team Up */}
          <div className="rounded-2xl border border-campus-border bg-campus-surface p-6 space-y-4 card-hover-effect">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-campus-text">Team Up Hackathons</h3>
            <p className="text-xs text-campus-text-muted leading-relaxed">
              Form competitive teams for campus hackathons like HackSRM. Match desired skills with offered proficiencies, manage membership capacities, and accept applicant join requests.
            </p>
            <Link
              to="/team-up"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-campus-cobalt hover:underline pt-2"
            >
              Browse hackathon teams <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Feature 3: Campus Passport */}
          <div className="rounded-2xl border border-campus-border bg-campus-surface p-6 space-y-4 card-hover-effect">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-campus-text">Campus Passport</h3>
            <p className="text-xs text-campus-text-muted leading-relaxed">
              Immutable digital proof of engagement. Badges are unlocked only via verified organizer QR check-ins, creating a portable public portfolio of real collegiate attendance.
            </p>
            <Link
              to="/passport"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-campus-cobalt hover:underline pt-2"
            >
              Inspect passport badges <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Upcoming Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-campus-cobalt">
              Upcoming Schedule
            </h2>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-campus-text">
              Active SRMIST Events
            </p>
          </div>

          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-sm font-semibold text-campus-cobalt hover:underline"
          >
            View all campus events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl border border-campus-border bg-campus-elevated animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* 4. SRMIST ACM Callout Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-campus-border bg-campus-surface p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-campus-cobalt">
              Join the Movement
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-campus-text">
              Ready to take center stage on campus?
            </h2>
            <p className="text-xs sm:text-sm text-campus-text-muted leading-relaxed">
              Whether you are pitching at HackSRM, mastering full-stack frameworks, or earning your Tech Pioneer badge, CampusPulse is your unified gateway to SRMIST technical excellence.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-campus-cobalt text-white shadow-md hover:bg-campus-cobalt-hover transition-colors"
              >
                Create Student Account
              </Link>
              <Link
                to="/events"
                className="px-5 py-2.5 rounded-xl font-semibold text-xs border border-campus-border bg-campus-elevated text-campus-text hover:bg-campus-surface transition-colors"
              >
                Browse Listings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
