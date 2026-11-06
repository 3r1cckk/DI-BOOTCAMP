import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Assignment } from '../types/assignment';
import { getUrgencyTier } from '../utils/dateUtils';

interface CalendarViewProps {
  assignments: Assignment[];
  onSelectAssignment: (assignment: Assignment) => void;
  onMarkSubmitted: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  assignments,
  onSelectAssignment,
  onMarkSubmitted,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Group assignments by date string "YYYY-MM-DD"
  const assignmentsByDate: Record<string, Assignment[]> = {};
  assignments.forEach((a) => {
    const dateKey = a.dueDate.split('T')[0];
    if (!assignmentsByDate[dateKey]) {
      assignmentsByDate[dateKey] = [];
    }
    assignmentsByDate[dateKey].push(a);
  });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar cells
  const calendarCells = [];
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
      
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">{monthName}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual submission calendar with scheduled deadlines and urgent milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px bg-slate-800 rounded-t-lg border border-slate-800 text-center text-xs font-semibold text-slate-400 py-2">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-px bg-slate-800/80 border-x border-b border-slate-800 rounded-b-lg overflow-hidden">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[90px] sm:min-h-[110px] bg-slate-950/40 p-1 sm:p-2"
              />
            );
          }

          const dayMonthStr = String(month + 1).padStart(2, '0');
          const dayPad = String(day).padStart(2, '0');
          const cellDateKey = `${year}-${dayMonthStr}-${dayPad}`;
          const isToday = cellDateKey === todayStr;
          const dayAssignments = assignmentsByDate[cellDateKey] || [];

          return (
            <div
              key={`day-${day}`}
              className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 transition-colors ${
                isToday ? 'bg-indigo-950/20' : 'bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-mono tabular-nums text-xs font-medium ${
                    isToday
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {day}
                </span>

                {dayAssignments.length > 0 && (
                  <span className="text-[10px] font-mono tabular-nums text-slate-500">
                    {dayAssignments.length} {dayAssignments.length === 1 ? 'due' : 'due'}
                  </span>
                )}
              </div>

              {/* Assignment markers */}
              <div className="space-y-1">
                {dayAssignments.map((a) => {
                  const isSubmitted = a.status === 'submitted';
                  const urgency = getUrgencyTier(a.dueDate, isSubmitted);
                  const time = a.dueDate.split('T')[1];

                  return (
                    <div
                      key={a.id}
                      onClick={() => onSelectAssignment(a)}
                      className={`text-[11px] p-1 sm:p-1.5 rounded border transition-colors cursor-pointer text-left leading-tight ${
                        isSubmitted
                          ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300 line-through opacity-70'
                          : urgency === 'critical' || urgency === 'overdue'
                          ? 'border-amber-800/80 bg-amber-950/40 text-amber-200'
                          : 'border-slate-700/80 bg-slate-800/80 text-slate-200 hover:border-slate-600'
                      }`}
                      title={`${a.courseCode}: ${a.title} (Due ${time})`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold truncate max-w-[80px] sm:max-w-[100px]">
                          {a.courseCode}
                        </span>
                        <span className="font-mono tabular-nums text-[10px] text-slate-400 shrink-0">
                          {time}
                        </span>
                      </div>
                      <div className="truncate text-slate-300 text-[10px] hidden sm:block mt-0.5">
                        {a.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
