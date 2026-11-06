export type UrgencyTier = 'submitted' | 'overdue' | 'critical' | 'urgent' | 'upcoming' | 'future';

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

export function getCountdown(dueDateStr: string): CountdownTime {
  const target = new Date(dueDateStr).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const isPast = diffMs < 0;
  const totalSeconds = Math.max(0, Math.floor(Math.abs(diffMs) / 1000));

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isPast, totalSeconds };
}

export function getUrgencyTier(dueDateStr: string, isSubmitted: boolean): UrgencyTier {
  if (isSubmitted) return 'submitted';
  const now = Date.now();
  const target = new Date(dueDateStr).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) return 'overdue';
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 6) return 'critical';
  if (diffHours <= 24) return 'urgent';
  if (diffHours <= 72) return 'upcoming';
  return 'future';
}

export function formatTimeRemaining(dueDateStr: string, isSubmitted: boolean): string {
  if (isSubmitted) return 'Submitted';

  const countdown = getCountdown(dueDateStr);
  if (countdown.isPast) {
    if (countdown.days > 0) return `Overdue by ${countdown.days}d ${countdown.hours}h`;
    if (countdown.hours > 0) return `Overdue by ${countdown.hours}h ${countdown.minutes}m`;
    return `Overdue by ${countdown.minutes}m`;
  }

  if (countdown.days > 2) {
    return `${countdown.days} days remaining`;
  }
  if (countdown.days >= 1) {
    return `${countdown.days}d ${countdown.hours}h remaining`;
  }
  if (countdown.hours >= 1) {
    return `${countdown.hours}h ${countdown.minutes}m left`;
  }
  return `${countdown.minutes}m ${countdown.seconds}s left`;
}

export function formatDueDateTime(dueDateStr: string): string {
  const d = new Date(dueDateStr);
  const now = new Date();
  
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const timeString = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) {
    return `Today at ${timeString}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${timeString}`;
  }

  const dateString = d.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return `${dateString} at ${timeString}`;
}

export const REMINDER_OFFSET_PRESETS = [
  { minutes: 15, label: '15 minutes before' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 120, label: '2 hours before' },
  { minutes: 360, label: '6 hours before' },
  { minutes: 720, label: '12 hours before' },
  { minutes: 1440, label: '24 hours before (1 day)' },
  { minutes: 2880, label: '48 hours before (2 days)' },
  { minutes: 4320, label: '72 hours before (3 days)' },
];

export function getOffsetLabel(minutes: number): string {
  const preset = REMINDER_OFFSET_PRESETS.find(p => p.minutes === minutes);
  if (preset) return preset.label;
  if (minutes < 60) return `${minutes} min before`;
  const hrs = Math.floor(minutes / 60);
  if (hrs < 24) return `${hrs} hours before`;
  const days = Math.round(hrs / 24);
  return `${days} days before`;
}
