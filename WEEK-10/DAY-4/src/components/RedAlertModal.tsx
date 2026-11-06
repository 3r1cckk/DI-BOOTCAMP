import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  ExternalLink,
  CheckCircle2,
  VolumeX,
  Clock,
  RotateCcw,
  X,
} from 'lucide-react';
import { Assignment } from '../types/assignment';
import { getCountdown, formatDueDateTime } from '../utils/dateUtils';

interface RedAlertModalProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
  onSilenceAlarm: () => void;
  onMarkSubmitted: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  isAlarmSounding: boolean;
}

export const RedAlertModal: React.FC<RedAlertModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onSilenceAlarm,
  onMarkSubmitted,
  onSnooze,
  isAlarmSounding,
}) => {
  const [, setTick] = useState(0);

  // Live timer for overdue seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !assignment) return null;

  const countdown = getCountdown(assignment.dueDate);
  const isOverdue = countdown.isPast;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Flashing Red Alert Container */}
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-rose-500 bg-slate-950 p-6 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.4)] text-slate-100 ring-4 ring-rose-500/30 animate-pulse-subtle">
        
        {/* Dismiss / Close cross */}
        <button
          onClick={() => {
            onSilenceAlarm();
            onClose();
          }}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close alert"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Flashing Red Alert Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/50 animate-bounce">
            <AlertOctagon className="h-8 w-8" />
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-rose-400 font-bold bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded">
                CRITICAL DEADLINE REACHED
              </span>
              {isAlarmSounding && (
                <span className="text-[11px] text-rose-300 font-mono animate-pulse flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping inline-block" />
                  SIREN ACTIVE
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1 leading-tight tracking-tight">
              Submission Time Expired!
            </h2>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Portal lock deadline has arrived. Submit your deliverables immediately!
            </p>
          </div>
        </div>

        {/* Assignment Specific Info */}
        <div className="mt-5 rounded-xl border border-rose-900/60 bg-rose-950/30 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-rose-200">
            <span className="font-bold text-white text-sm">{assignment.courseCode}</span>
            <span aria-hidden="true" className="text-rose-500">·</span>
            <span className="truncate">{assignment.courseName}</span>
            {assignment.weightPercentage && (
              <>
                <span aria-hidden="true" className="text-rose-500">·</span>
                <span className="font-mono font-semibold text-rose-300">
                  {assignment.weightPercentage}% of Grade
                </span>
              </>
            )}
          </div>

          <h3 className="text-base font-bold text-white leading-snug">
            {assignment.title}
          </h3>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-900/50 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="h-4 w-4 text-rose-400" />
              <span>Due: {formatDueDateTime(assignment.dueDate)}</span>
            </div>

            <div className="font-mono tabular-nums text-sm font-extrabold text-rose-400">
              {isOverdue ? (
                <span>
                  OVERDUE BY: {countdown.days > 0 && `${countdown.days}d `}
                  {String(countdown.hours).padStart(2, '0')}:
                  {String(countdown.minutes).padStart(2, '0')}:
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
              ) : (
                <span>DUE RIGHT NOW</span>
              )}
            </div>
          </div>

          {assignment.notes && (
            <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded border border-rose-900/40">
              <span className="text-slate-400 font-semibold block text-[11px] mb-0.5">INSTRUCTIONS:</span>
              {assignment.notes}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          
          {/* Main Action 1: Open Submission Portal */}
          {assignment.submissionUrl && (
            <a
              href={assignment.submissionUrl}
              target="_blank"
              rel="noreferrer"
              onClick={onSilenceAlarm}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/40 cursor-pointer"
            >
              <span>Launch {assignment.submissionPlatform.toUpperCase()} & Upload Deliverables</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {/* Main Action 2: I Submitted it! */}
          <button
            onClick={() => {
              onSilenceAlarm();
              onMarkSubmitted(assignment.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/40 cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>I Submitted It! (Mark Completed & Stop Alarm)</span>
          </button>

          {/* Secondary Controls: Silence & Snooze */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onSilenceAlarm}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <VolumeX className="h-3.5 w-3.5 text-rose-400" />
              <span>Silence Danger Sound</span>
            </button>

            <button
              onClick={() => {
                onSilenceAlarm();
                onSnooze(assignment.id, 10);
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              <span>Snooze (10 mins)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
