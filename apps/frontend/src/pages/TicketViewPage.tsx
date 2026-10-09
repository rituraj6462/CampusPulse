import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/api';
import { TicketItem, TicketStatus } from '@campuspulse/shared';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

export const TicketViewPage: React.FC = () => {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const [ticket, setTicket] = useState<TicketItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketCode) return;
      try {
        const res = await api.get<{ success: boolean; data: TicketItem }>(`/tickets/${ticketCode}`);
        if (res.success) {
          setTicket(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Ticket could not be retrieved.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketCode]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4 animate-pulse">
        <div className="h-96 rounded-3xl bg-campus-elevated" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-campus-text">Invalid Ticket Pass</h2>
        <p className="text-xs text-campus-text-muted">{error || 'This ticket code was not found or has been voided.'}</p>
        <Link to="/dashboard" className="inline-block px-4 py-2 rounded-lg bg-campus-cobalt text-white text-xs font-semibold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isCheckedIn = ticket.status === TicketStatus.CHECKED_IN;
  const isVoided = ticket.status === TicketStatus.VOIDED;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Top back navigation and print action */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-campus-text-muted hover:text-campus-text"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-campus-border bg-campus-surface text-xs font-semibold text-campus-text hover:bg-campus-elevated transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Print Pass
        </button>
      </div>

      {/* Boarding Pass Container */}
      <div
        ref={ticketRef}
        className="rounded-3xl border-2 border-campus-border bg-campus-surface shadow-2xl overflow-hidden print:border-black print:shadow-none"
      >
        {/* Header Ribbon */}
        <div className="bg-campus-cobalt px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight">CampusPulse Pass</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">ACM SRMIST</span>
          </div>

          <div>
            {isCheckedIn ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Checked In
              </span>
            ) : isVoided ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
                Voided / Cancelled
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-blue-900 shadow-sm">
                Verified Active
              </span>
            )}
          </div>
        </div>

        {/* Main Pass Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Event Title */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-campus-cobalt">
              Event Registration
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-campus-text mt-0.5 leading-snug">
              {ticket.event?.title}
            </h1>
          </div>

          {/* Attendee Details */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-campus-elevated/60 border border-campus-border-subtle">
            <div>
              <p className="text-[10px] uppercase font-bold text-campus-text-dim">Student Attendee</p>
              <p className="text-xs font-bold text-campus-text mt-0.5">{ticket.user?.name}</p>
              <p className="text-[10px] text-campus-text-muted truncate">{ticket.user?.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-campus-text-dim">Department</p>
              <p className="text-xs font-bold text-campus-text mt-0.5">{ticket.user?.department || 'SRMIST Student'}</p>
              <p className="text-[10px] text-campus-text-muted">Batch {ticket.user?.graduationYear || '2026'}</p>
            </div>
          </div>

          {/* Time & Venue */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-campus-cobalt shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-campus-text">
                  {new Date(ticket.event?.startDate || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-[11px] text-campus-text-dim">
                  {new Date(ticket.event?.startDate || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-campus-cobalt shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-campus-text">{ticket.event?.venue}</p>
                <p className="text-[11px] text-campus-text-dim">SRMIST Campus</p>
              </div>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-campus-border" />
            <div className="absolute -left-10 w-6 h-6 rounded-full bg-campus-bg border border-campus-border" />
            <div className="absolute -right-10 w-6 h-6 rounded-full bg-campus-bg border border-campus-border" />
          </div>

          {/* High-Contrast QR Code Section */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-md">
              {/* Always black QR on white background for 100% camera scanner readability */}
              <QRCodeSVG
                value={ticket.qrCodePayload || ticket.ticketCode}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="text-center">
              <p className="font-mono text-sm sm:text-base font-extrabold tracking-widest text-campus-text uppercase">
                {ticket.ticketCode}
              </p>
              <p className="text-[10px] text-campus-text-dim mt-0.5">
                Present this QR code or manual identifier at event entry desk
              </p>
            </div>
          </div>

          {/* Attendance stamp if checked in */}
          {ticket.attendance && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-0.5">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                Verified Check-In Recorded
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Timestamp: {new Date(ticket.attendance.checkedInAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
