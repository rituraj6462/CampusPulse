import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCheck, ExternalLink, Calendar, Users, Trophy, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REGISTRATION':
        return <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'WAITLIST':
        return <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'TEAM':
        return <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'CHECK_IN':
        return <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Trophy className="w-4 h-4 text-campus-cobalt" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className="relative p-2 rounded-lg border border-campus-border bg-campus-surface text-campus-text hover:bg-campus-elevated hover:text-campus-cobalt transition-colors duration-150"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-campus-border bg-campus-surface shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
          <div className="flex items-center justify-between p-3.5 border-b border-campus-border bg-campus-elevated/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-campus-text">Campus Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-campus-cobalt hover:underline flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-campus-border-subtle">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-campus-text-muted">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markNotificationAsRead(notif.id)}
                  className={`p-3.5 flex gap-3 text-left transition-colors cursor-pointer hover:bg-campus-elevated/60 ${
                    !notif.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-campus-elevated">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className={`text-xs font-semibold truncate ${!notif.read ? 'text-campus-text' : 'text-campus-text-muted'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-campus-text-dim shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-campus-text-muted leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    {notif.link && (
                      <Link
                        to={notif.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-campus-cobalt hover:underline"
                      >
                        View Details <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
