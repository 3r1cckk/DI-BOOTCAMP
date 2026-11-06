import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import { Assignment } from '../types/assignment';
import { getCountdown, getUrgencyTier, formatDueDateTime } from '../utils/dateUtils';

interface LiveUrgencyBannerProps {
  assignments: Assignment[];
  onMarkSubmitted: (id: string) => void;
  onOpenDetails: (assignment: Assignment) => void;
}

export const LiveUrgencyBanner: React.FC<LiveUrgencyBannerProps> = ({
  assignments,
  onMarkSubmitted,
  onOpenDetails,
}) => {
  const [, setTick] = useState(0);

  // Update clock every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter unsubmitted assignments sorted by due date
  const pending = assignments
    .filter((a) => a.status !== 'submitted')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (pending.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm">
            <span className="font-semibold text-white">All caught up!</span> No pending assignments due right now.
          </p>
        </div>
      </div>
    );
  }

  const nextAssignment = pending[0];
  const countdown = getCountdown(nextAssignment.dueDate);
  const urgency = getUrgencyTier(nextAssignment.dueDate, false);

  const isOverdue = countdown.isPast;
  const isCritical = urgency === 'critical' || isOverdue;

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isOverdue
          ? 'border-rose-800 bg-rose-950/30'
          : isCritical
          ? 'border-amber-800/80 bg-amber-950/25'
          : 'border-slate-800 bg-slate-900/60'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isOverdue
                ? 'bg-rose-500/20 text-rose-400'
                : isCritical
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-indigo-500/20 text-indigo-400'
            }`}
          >
            {isOverdue || isCritical ? (
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            ) : (
              <Clock className="h-5 w-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <span className="font-semibold text-slate-200">{nextAssignment.courseCode}</span>
              <span aria-hidden="true">·</span>
              <span>{nextAssignment.courseName}</span>
              {nextAssignment.weightPercentage && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{nextAssignment.weightPercentage}% of final grade</span>
                </>
              )}
            </div>

            <h3
              onClick={() => onOpenDetails(nextAssignment)}
              className="font-semibold text-white hover:text-indigo-300 transition-colors cursor-pointer text-base"
            >
              {nextAssignment.title}
            </h3>

            <p className="text-xs text-slate-400 mt-0.5">
              Due: {formatDueDateTime(nextAssignment.dueDate)}
            </p>
          </div>
        </div>

        {/* Live Countdown & Primary Actions */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">
              {isOverdue ? 'DEADLINE EXPIRED' : 'TIME REMAINING'}
            </span>
            <div
              className={`font-mono tabular-nums text-lg font-bold tracking-tight ${
                isOverdue
                  ? 'text-rose-400'
                  : isCritical
                  ? 'text-amber-400'
                  : 'text-indigo-300'
              }`}
            >
              {isOverdue ? '-' : ''}
              {countdown.days > 0 && `${countdown.days}d `}
              {String(countdown.hours).padStart(2, '0')}:
              {String(countdown.minutes).padStart(2, '0')}:
              {String(countdown.seconds).padStart(2, '0')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {nextAssignment.submissionUrl && (
              <a
                href={nextAssignment.submissionUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>Open {nextAssignment.submissionPlatform}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            <button
              onClick={() => onMarkSubmitted(nextAssignment.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-emerald-600/30 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Submit Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
