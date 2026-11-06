import { Assignment } from '../types/assignment';

/**
 * Generates an iCalendar (.ics) string for importing deadlines into Google Calendar, Apple Calendar, or Outlook.
 */
export function generateIcsCalendar(assignments: Assignment[]): string {
  const formatDateToICS = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (str: string): string => {
    return (str || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DuePulse//Student Assignment Deadlines//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:DuePulse Student Deadlines',
    'X-WR-TIMEZONE:UTC',
  ];

  assignments.forEach((a) => {
    if (a.status === 'submitted') return; // optionally skip already submitted or include them

    const start = formatDateToICS(a.dueDate);
    // End 30 min after start
    const endDate = new Date(new Date(a.dueDate).getTime() + 30 * 60 * 1000);
    const end = formatDateToICS(endDate.toISOString());

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:duepulse-${a.id}@student.duepulse.app`);
    lines.push(`DTSTAMP:${formatDateToICS(new Date().toISOString())}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:[${escapeText(a.courseCode)}] ${escapeText(a.title)} Due`);
    
    let desc = `Course: ${a.courseCode} - ${a.courseName}\\n`;
    desc += `Type: ${a.type}\\n`;
    if (a.weightPercentage) desc += `Weight: ${a.weightPercentage}% of final grade\\n`;
    if (a.submissionPlatform) desc += `Submit on: ${a.submissionPlatform}\\n`;
    if (a.submissionUrl) desc += `Portal link: ${a.submissionUrl}\\n`;
    if (a.notes) desc += `Notes: ${a.notes}\\n`;
    lines.push(`DESCRIPTION:${escapeText(desc)}`);

    if (a.submissionUrl) {
      lines.push(`URL:${a.submissionUrl}`);
    }

    // Add reminder alarms based on configured reminder offsets
    a.reminderOffsets.slice(0, 3).forEach((offsetMins) => {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:Reminder: ${escapeText(a.title)} is due in ${Math.round(offsetMins / 60)} hours!`);
      lines.push(`TRIGGER:-PT${offsetMins}M`);
      lines.push('END:VALARM');
    });

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsFile(assignments: Assignment[], filename = 'student_assignment_deadlines.ics') {
  const icsData = generateIcsCalendar(assignments);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
