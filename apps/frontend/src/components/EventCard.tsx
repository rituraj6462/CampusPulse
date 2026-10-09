import React from 'react';
import { Link } from 'react-router-dom';
import { EventItem, EventStatus } from '@campuspulse/shared';
import { Calendar, MapPin, Users, Sparkles, ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  featured?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, featured = false }) => {
  const startDate = new Date(event.startDate);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const capacityPercent = Math.min(100, Math.round((event.confirmedCount / event.capacity) * 100));
  const isFull = event.availableSeats === 0;

  return (
    <article
      className={`group relative flex flex-col rounded-2xl border border-campus-border bg-campus-surface overflow-hidden card-hover-effect shadow-subtle ${
        featured ? 'md:grid md:grid-cols-12 md:gap-6' : ''
      }`}
    >
      {/* Banner Image Container */}
      <div className={`relative overflow-hidden bg-campus-elevated ${featured ? 'md:col-span-7 h-64 md:h-full min-h-[260px]' : 'h-48'}`}>
        <img
          src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-black/80 text-black dark:text-white backdrop-blur-md shadow-sm">
            {event.category}
          </span>

          <div className="flex items-center gap-1.5">
            {event.isHackathon && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-black shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Team Up
              </span>
            )}
            {isFull ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm">
                Waitlist Open
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-sm">
                {event.availableSeats} Seats Left
              </span>
            )}
          </div>
        </div>

        {/* User state badge if registered */}
        {event.userRegistration && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-600 text-white shadow-md flex items-center gap-1.5">
              <span>&#10003; Registered</span>
              {event.userRegistration.ticketCode && (
                <span className="opacity-80 font-mono text-[10px]">
                  ({event.userRegistration.ticketCode})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-5 flex flex-col justify-between flex-1 ${featured ? 'md:col-span-5 md:py-6 md:pr-6 md:pl-0' : ''}`}>
        <div className="space-y-2.5">
          {/* Date & Location header */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-campus-text-muted font-medium">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-campus-cobalt" />
              <span>{formattedDate} &bull; {formattedTime}</span>
            </div>
            <div className="flex items-center gap-1 truncate max-w-[180px]">
              <MapPin className="w-3.5 h-3.5 text-campus-text-dim" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className={`font-bold tracking-tight text-campus-text group-hover:text-campus-cobalt transition-colors ${
            featured ? 'text-xl sm:text-2xl leading-snug' : 'text-base sm:text-lg leading-snug line-clamp-2'
          }`}>
            <Link to={`/events/${event.slug}`} className="focus:outline-none">
              <span className="absolute inset-0 z-10" aria-hidden="true" />
              {event.title}
            </Link>
          </h3>

          {/* Short Description */}
          <p className="text-xs text-campus-text-muted line-clamp-2 leading-relaxed">
            {event.shortDescription || event.description}
          </p>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {event.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-campus-elevated text-campus-text-dim border border-campus-border-subtle"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Capacity & Action */}
        <div className="pt-4 mt-4 border-t border-campus-border-subtle">
          <div className="flex items-center justify-between text-xs text-campus-text-muted mb-1.5">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-campus-text-dim" />
              <span>{event.confirmedCount} / {event.capacity} Filled</span>
            </div>
            <span className="font-semibold text-campus-text">
              {capacityPercent}%
            </span>
          </div>

          {/* Capacity Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-campus-elevated overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isFull ? 'bg-rose-500' : capacityPercent > 80 ? 'bg-amber-500' : 'bg-blue-600 dark:bg-blue-500'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-campus-cobalt">
            <span>View Details &amp; Registration</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </article>
  );
};
