import React from 'react';
import { AlertCircle, Clock, CheckCircle2, ExternalLink, Calendar } from 'lucide-react';
import { Assignment } from '../types/assignment';
import { getCountdown, getUrgencyTier, formatDueDateTime } from '../utils/dateUtils';

interface RadarViewProps {
  assignments: Assignment[];
  onMarkSubmitted: (id: string) => void;
  onOpenDetails: (assignment: Assignment) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  assignments,
  onMarkSubmitted,
  onOpenDetails,
}) => {
  const now = Date.now();
  const pending = assignments
    .filter((a) => a.status !== 'submitted')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Horizons:
  // 1. Critical: < 12h or overdue
  // 2. Urgent: 12h - 36h
  // 3. Approaching: 36h - 5 days
  // 4. Future: > 5 days
  const criticalList: Assignment[] = [];
  const urgentList: Assignment[] = [];
  const approachingList: Assignment[] = [];
  const futureList: Assignment[] = [];

  pending.forEach((a) => {
    const diffHours = (new Date(a.dueDate).getTime() - now) / (1000 * 60 * 60);
    if (diffHours <= 12) {
      criticalList.push(a);
    } else if (diffHours <= 36) {
      urgentList.push(a);
    } else if (diffHours <= 120) {
      approachingList.push(a);
    } else {
      futureList.push(a);
    }
  });

  const renderSection = (
    title: string,
    subtitle: string,
    items: Assignment[],
    colorTheme: 'rose' | 'amber' | 'indigo' | 'slate'
  ) => {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  colorTheme === 'rose'
                    ? 'bg-rose-500'
                    : colorTheme === 'amber'
                    ? 'bg-amber-500'
                    : colorTheme === 'indigo'
                    ? 'bg-indigo-500'
                    : 'bg-slate-500'
                }`}
              />
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <span className="font-mono tabular-nums text-xs text-slate-400 font-semibold">
            {items.length} {items.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No assignments in this window.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const countdown = getCountdown(item.dueDate);
              const urgency = getUrgencyTier(item.dueDate, false);
              const completedSubtasks = item.subtasks.filter((s) => s.completed).length;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    urgency === 'overdue'
                      ? 'border-rose-900/80 bg-rose-950/20'
                      : urgency === 'critical'
                      ? 'border-amber-900/70 bg-amber-950/20'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-200">{item.courseCode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.courseName}</span>
                        {item.weightPercentage && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{item.weightPercentage}% grade</span>
                          </>
                        )}
                      </div>

                      <h4
                        onClick={() => onOpenDetails(item)}
                        className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors cursor-pointer truncate"
                      >
                        {item.title}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>Due {formatDueDateTime(item.dueDate)}</span>
                        {item.subtasks.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {completedSubtasks}/{item.subtasks.length} steps done
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Countdown clock & fast submit */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">REMAINING</span>
                        <span
                          className={`font-mono tabular-nums text-sm font-bold ${
                            countdown.isPast
                              ? 'text-rose-400'
                              : urgency === 'critical'
                              ? 'text-amber-400'
                              : 'text-indigo-300'
                          }`}
                        >
                          {countdown.isPast ? 'Overdue' : ''}
                          {!countdown.isPast &&
                            `${countdown.days > 0 ? `${countdown.days}d ` : ''}${String(
                              countdown.hours
                            ).padStart(2, '0')}:${String(countdown.minutes).padStart(2, '0')}:${String(
                              countdown.seconds
                            ).padStart(2, '0')}`}
                        </span>
                      </div>

                      {item.submissionUrl && (
                        <a
                          href={item.submissionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                          title={`Open ${item.submissionPlatform}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}

                      <button
                        onClick={() => onMarkSubmitted(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm shadow-emerald-600/30 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Submit</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Deadline Urgency Horizons</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Prioritized submission pipeline so you allocate focus where deadlines are closing fastest.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {renderSection(
          'Critical Window (< 12 Hours)',
          'High priority: Complete final polish and upload deliverables immediately.',
          criticalList,
          'rose'
        )}

        {renderSection(
          'Next 36 Hours (Tomorrow & Overnight)',
          'Requires active drafting, problem solving, or test suite validation today.',
          urgentList,
          'amber'
        )}

        {renderSection(
          'Approaching (2 to 5 Days)',
          'Start reviewing syllabus prompts and create outline drafts.',
          approachingList,
          'indigo'
        )}

        {renderSection(
          'On Deck (> 5 Days)',
          'Upcoming coursework scheduled on your course calendars.',
          futureList,
          'slate'
        )}
      </div>
    </div>
  );
};
