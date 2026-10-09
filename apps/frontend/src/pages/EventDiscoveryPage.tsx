import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { EventItem, CAMPUS_INTERESTS } from '@campuspulse/shared';
import { EventCard } from '../components/EventCard';
import { Search, Filter, SlidersHorizontal, Sparkles, X } from 'lucide-react';

export const EventDiscoveryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('available') === 'true');
  const [hackathonOnly, setHackathonOnly] = useState(searchParams.get('hackathon') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchTerm.trim()) queryParams.set('search', searchTerm.trim());
        if (selectedCategory !== 'All') queryParams.set('category', selectedCategory);
        if (availableOnly) queryParams.set('availableOnly', 'true');
        if (hackathonOnly) queryParams.set('hackathonOnly', 'true');
        queryParams.set('sortBy', sortBy);

        const res = await api.get<{ success: boolean; data: EventItem[] }>(`/events?${queryParams.toString()}`);
        if (res.success) {
          setEvents(res.data);
        }
      } catch (err) {
        console.error('Failed to search events', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchEvents();
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, availableOnly, hackathonOnly, sortBy]);

  const categories = ['All', 'Hackathons & Competitions', 'Workshops & Seminars', 'AI & Machine Learning', 'Competitive Programming', 'Cybersecurity'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-campus-text">
          Campus Event Discovery
        </h1>
        <p className="text-sm text-campus-text-muted max-w-2xl">
          Browse upcoming academic conferences, competitive programming sprints, workshops, and flagship hackathons across SRM Institute of Science and Technology.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-campus-text-dim" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, topic, lab, or venue..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-campus-border bg-campus-surface text-sm text-campus-text placeholder:text-campus-text-dim focus:outline-none focus:border-campus-cobalt transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-campus-text-dim hover:text-campus-text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Toggles & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                availableOnly
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-campus-border bg-campus-surface text-campus-text-muted hover:bg-campus-elevated'
              }`}
            >
              Open Seats Only
            </button>

            <button
              onClick={() => setHackathonOnly(!hackathonOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1 ${
                hackathonOnly
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                  : 'border-campus-border bg-campus-surface text-campus-text-muted hover:bg-campus-elevated'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Hackathons Only
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-campus-border bg-campus-surface text-campus-text focus:outline-none focus:border-campus-cobalt cursor-pointer"
            >
              <option value="date">Sort: Soonest Date</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-campus-cobalt text-white shadow-sm'
                  : 'border border-campus-border bg-campus-surface text-campus-text-muted hover:bg-campus-elevated'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-2xl border border-campus-border bg-campus-elevated animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-campus-border bg-campus-surface p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-campus-elevated text-campus-text-dim flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-campus-text">No events match your criteria</h3>
          <p className="text-xs text-campus-text-muted max-w-sm mx-auto">
            Try adjusting your search query, selecting "All" categories, or resetting the seat availability filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setAvailableOnly(false);
              setHackathonOnly(false);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-campus-elevated text-campus-text hover:bg-campus-border transition-colors mt-2"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
