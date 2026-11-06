import React from 'react';
import { AlertCircle, Clock, CheckCircle, ListChecks } from 'lucide-react';
import { Assignment } from '../types/assignment';

interface StatBarProps {
  assignments: Assignment[];
}

export const StatBar: React.FC<StatBarProps> = ({ assignments }) => {
  const now = Date.now();
  const next24Hours = now + 24 * 60 * 60 * 1000;

  const dueSoon = assignments.filter((a) => {
    if (a.status === 'submitted') return false;
    const dueTime = new Date(a.dueDate).getTime();
    return dueTime <= next24Hours;
  }).length;

  const inProgress = assignments.filter((a) => a.status === 'in_progress').length;
  const submitted = assignments.filter((a) => a.status === 'submitted').length;

  // Total subtask progress
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  assignments.forEach((a) => {
    a.subtasks.forEach((st) => {
      totalSubtasks++;
      if (st.completed) completedSubtasks++;
    });
  });

  const completionRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Due Within 24 Hours</span>
          <AlertCircle className={`h-4 w-4 ${dueSoon > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono tabular-nums text-2xl font-bold text-white">{dueSoon}</span>
          <span className="text-xs text-slate-500">{dueSoon === 1 ? 'assignment' : 'assignments'}</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>In Progress</span>
          <Clock className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono tabular-nums text-2xl font-bold text-white">{inProgress}</span>
          <span className="text-xs text-slate-500">active</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Submitted</span>
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono tabular-nums text-2xl font-bold text-white">{submitted}</span>
          <span className="text-xs text-slate-500">completed</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Subtask Progress</span>
          <ListChecks className="h-4 w-4 text-sky-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono tabular-nums text-2xl font-bold text-white">{completionRate}%</span>
          <span className="text-xs text-slate-500">
            {completedSubtasks}/{totalSubtasks} steps
          </span>
        </div>
      </div>
    </div>
  );
};
