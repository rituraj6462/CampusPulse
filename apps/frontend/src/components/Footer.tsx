import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Github, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-campus-border bg-campus-surface transition-colors duration-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-campus-cobalt flex items-center justify-center text-white text-xs font-bold">
                CP
              </div>
              <span className="font-bold text-base text-campus-text">CampusPulse</span>
            </div>
            <p className="text-xs text-campus-text-muted max-w-md leading-relaxed">
              Find your crowd. Build your campus story. The official event orchestration platform for ACM Student Chapter SRMIST. Designed with architectural rigor, concurrency-safe transactions, and authentic campus community features.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-campus-text-dim">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All campus systems operational &bull; PostgreSQL &amp; Prisma ORM verified</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-campus-text mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-campus-text-muted">
              <li>
                <Link to="/events" className="hover:text-campus-cobalt transition-colors">Discover Events</Link>
              </li>
              <li>
                <Link to="/pulse-match" className="hover:text-campus-cobalt transition-colors">Pulse Match Recommendations</Link>
              </li>
              <li>
                <Link to="/team-up" className="hover:text-campus-cobalt transition-colors">Team Up Hackathons</Link>
              </li>
              <li>
                <Link to="/passport" className="hover:text-campus-cobalt transition-colors">Campus Passport &amp; Badges</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-campus-cobalt transition-colors">My Tickets &amp; Registrations</Link>
              </li>
            </ul>
          </div>

          {/* Institutional info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-campus-text mb-3">
              Community
            </h4>
            <ul className="space-y-2 text-xs text-campus-text-muted">
              <li>
                <span className="text-campus-text font-medium">ACM Student Chapter SRMIST</span>
              </li>
              <li>
                <span>Department of Computing Technologies</span>
              </li>
              <li>
                <span>SRM Institute of Science and Technology</span>
              </li>
              <li>
                <span>Kattankulathur, Chennai 603203</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-campus-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-campus-text-dim">
          <p>
            &copy; {new Date().getFullYear()} CampusPulse &bull; Built with pride for ACM Student Chapter SRMIST.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              Engineered with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for campus innovators
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
