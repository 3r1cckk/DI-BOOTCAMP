import React, { useState } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Circle,
  MoreVertical,
  Bell,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertOctagon,
} from 'lucide-react';
import { Assignment } from '../types/assignment';
import { formatTimeRemaining, formatDueDateTime, getUrgencyTier, getCountdown } from '../utils/dateUtils';

interface AssignmentCardProps {
  assignment: Assignment;
  onToggleSubtask: (assignmentId: string, subtaskId: string) => void;
  onToggleStatus: (assignmentId: string) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignmentId: string) => void;
  onSnooze: (assignmentId: string, minutes: number) => void;
  onTestReminderAlert: (assignment: Assignment) => void;
  onTriggerRedAlert?: (assignment: Assignment) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onToggleSubtask,
  onToggleStatus,
  onEdit,
  onDelete,
  onSnooze,
  onTestReminderAlert,
  onTriggerRedAlert,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  const isSubmitted = assignment.status === 'submitted';
  const urgency = getUrgencyTier(assignment.dueDate, isSubmitted);
  const countdown = getCountdown(assignment.dueDate);
  const timeRemainingStr = formatTimeRemaining(assignment.dueDate, isSubmitted);

  const totalSubtasks = assignment.subtasks.length;
  const completedSubtasks = assignment.subtasks.filter((s) => s.completed).length;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Format type nicely (e.g. "problem_set" -> "Problem Set")
  const formatType = (type: string) => {
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div
      className={`rounded-xl border transition-all ${
        isSubmitted
          ? 'border-slate-800/60 bg-slate-900/30 opacity-75'
          : urgency === 'overdue'
          ? 'border-rose-900/80 bg-rose-950/20'
          : urgency === 'critical'
          ? 'border-amber-900/80 bg-amber-950/15'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
      } p-4 sm:p-5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          
          {/* Unboxed clean metadata (Zero-pill discipline) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-200">{assignment.courseCode}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="truncate max-w-[180px]">{assignment.courseName}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{formatType(assignment.type)}</span>
            {assignment.weightPercentage !== undefined && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-300 font-mono tabular-nums">{assignment.weightPercentage}% weight</span>
              </>
            )}
          </div>

          {/* Title & Submission Link */}
          <div className="flex items-start gap-2">
            <h4
              onClick={() => onEdit(assignment)}
              className={`text-base font-semibold leading-snug cursor-pointer hover:text-indigo-400 transition-colors ${
                isSubmitted ? 'text-slate-400 line-through' : 'text-white'
              }`}
            >
              {assignment.title}
            </h4>
          </div>

          {/* Due date, Countdown, & Urgency */}
          <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
            <div className="text-slate-300">
              <span className="text-slate-500">Due: </span>
              <span>{formatDueDateTime(assignment.dueDate)}</span>
            </div>

            <span aria-hidden="true" className="text-slate-600">·</span>

            <div
              className={`font-mono tabular-nums font-medium ${
                isSubmitted
                  ? 'text-emerald-400'
                  : urgency === 'overdue'
                  ? 'text-rose-400'
                  : urgency === 'critical'
                  ? 'text-amber-400'
                  : urgency === 'urgent'
                  ? 'text-indigo-300'
                  : 'text-slate-400'
              }`}
            >
              {timeRemainingStr}
            </div>

            {assignment.reminderOffsets.length > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Bell className="h-3 w-3 text-slate-400" />
                  {assignment.reminderOffsets.length} alerts set
                </span>
              </>
            )}
          </div>

          {assignment.notes && (
            <p className="text-xs text-slate-400 mt-2 line-clamp-2 bg-slate-950/40 rounded-lg p-2 border border-slate-800/80">
              {assignment.notes}
            </p>
          )}

          {/* Subtasks summary */}
          {totalSubtasks > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <button
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <span>Milestones & Subtasks</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    ({completedSubtasks}/{totalSubtasks})
                  </span>
                  {showSubtasks ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
                <span className="font-mono tabular-nums text-slate-400 text-[11px]">{subtaskPercent}% complete</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${subtaskPercent}%` }}
                />
              </div>

              {/* Subtasks detail list */}
              {showSubtasks && (
                <div className="mt-2.5 space-y-1.5 pl-1">
                  {assignment.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => onToggleSubtask(assignment.id, st.id)}
                      className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer group py-0.5"
                    >
                      {st.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                      )}
                      <span className={st.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {st.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: Action buttons */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 top-8 z-30 w-48 rounded-lg border border-slate-800 bg-slate-900 shadow-xl py-1 text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(assignment);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white text-left cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onTestReminderAlert(assignment);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white text-left cursor-pointer"
                >
                  <Bell className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Test Standard Chime</span>
                </button>

                {onTriggerRedAlert && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onTriggerRedAlert(assignment);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-300 hover:bg-rose-950/60 hover:text-rose-200 text-left cursor-pointer font-medium"
                  >
                    <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                    <span>Test Red Alert & Siren</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowSnoozeOptions(!showSnoozeOptions);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white text-left cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                  <span>Snooze Alerts</span>
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(assignment.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-950/40 text-left cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Assignment</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Snooze Selector */}
          {showSnoozeOptions && (
            <div className="absolute right-12 z-20 w-44 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl text-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block px-1 mb-1">SNOOZE REMINDER FOR:</span>
              <button
                onClick={() => {
                  onSnooze(assignment.id, 30);
                  setShowSnoozeOptions(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 cursor-pointer"
              >
                30 minutes
              </button>
              <button
                onClick={() => {
                  onSnooze(assignment.id, 120);
                  setShowSnoozeOptions(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 cursor-pointer"
              >
                2 hours
              </button>
              <button
                onClick={() => {
                  onSnooze(assignment.id, 1440);
                  setShowSnoozeOptions(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 cursor-pointer"
              >
                1 day
              </button>
            </div>
          )}

          {/* External portal submission link button */}
          {assignment.submissionUrl && (
            <a
              href={assignment.submissionUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
              title={`Open ${assignment.submissionPlatform} submission page`}
            >
              <span>{assignment.submissionPlatform.charAt(0).toUpperCase() + assignment.submissionPlatform.slice(1)}</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          )}

          {/* Submit / Unsubmit toggle button */}
          <button
            onClick={() => onToggleStatus(assignment.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              isSubmitted
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/40'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/20'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{isSubmitted ? 'Submitted' : 'Mark Submitted'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
