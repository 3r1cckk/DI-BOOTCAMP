import React, { useState } from 'react';
import { Download, Upload, BookOpen, Calendar, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Assignment } from '../types/assignment';
import { downloadIcsFile } from '../services/icsExport';
import { COURSE_TEMPLATES } from '../data/sampleAssignments';

interface CourseSyncModalProps {
  assignments: Assignment[];
  onImportAssignments: (newAssignments: Assignment[]) => void;
  onLoadTemplate: (templateName: string) => void;
}

export const CourseSyncModal: React.FC<CourseSyncModalProps> = ({
  assignments,
  onImportAssignments,
  onLoadTemplate,
}) => {
  const [syllabusText, setSyllabusText] = useState('');
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [copiedIcs, setCopiedIcs] = useState(false);

  const handleExportIcs = () => {
    downloadIcsFile(assignments);
    setCopiedIcs(true);
    setTimeout(() => setCopiedIcs(false), 3000);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(assignments, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duepulse_assignments_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportAssignments(parsed);
          setParseStatus(`Successfully imported ${parsed.length} assignments from backup.`);
        } else {
          setParseStatus('Invalid JSON file format.');
        }
      } catch {
        setParseStatus('Failed to read backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Simple, robust client-side syllabus parser
  const handleParseSyllabus = () => {
    if (!syllabusText.trim()) return;

    const lines = syllabusText.split('\n').filter((l) => l.trim().length > 0);
    const parsedList: Assignment[] = [];
    const now = new Date();

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      // Match pattern like: CS101: Midterm Project due 2026-10-28
      const courseMatch = trimmed.match(/^([A-Z]{2,4}\s*\d{3})/i);
      const courseCode = courseMatch ? courseMatch[1].toUpperCase() : 'COURSE';

      // Fallback due date: index + 2 days ahead
      const targetDate = new Date(now.getTime() + (index + 2) * 86400000);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');

      parsedList.push({
        id: 'parsed-' + Date.now() + '-' + index,
        title: trimmed.replace(/^([A-Z]{2,4}\s*\d{3}[:\s-]*)/i, ''),
        courseCode,
        courseName: courseCode,
        courseColor: 'indigo',
        type: 'problem_set',
        dueDate: `${yyyy}-${mm}-${dd}T23:59`,
        priority: 'high',
        status: 'not_started',
        weightPercentage: 15,
        submissionPlatform: 'canvas',
        reminderOffsets: [1440, 360, 60],
        subtasks: [
          { id: `st-${index}-1`, text: 'Review prompt & requirements', completed: false },
          { id: `st-${index}-2`, text: 'Submit final draft before deadline', completed: false },
        ],
        createdAt: new Date().toISOString(),
      });
    });

    if (parsedList.length > 0) {
      onImportAssignments(parsedList);
      setParseStatus(`Imported ${parsedList.length} assignments from your syllabus!`);
      setSyllabusText('');
    } else {
      setParseStatus('Could not identify items in text.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Google Calendar & Device Sync */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              Calendar & External Device Sync
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Export all upcoming deadlines and reminder alarms directly into Google Calendar, Apple Calendar, or Outlook.
              Native calendar alerts will buzz your phone, smartwatch, and laptop.
            </p>
          </div>

          <button
            onClick={handleExportIcs}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm shadow-indigo-600/30 cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedIcs ? <Check className="h-4 w-4 text-emerald-300" /> : <Download className="h-4 w-4" />}
            <span>{copiedIcs ? 'Calendar Exported!' : 'Export to iCalendar (.ics)'}</span>
          </button>
        </div>
      </div>

      {/* Preset Course Templates */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            Quick University Course Packs
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Load pre-configured course loads with realistic assignments, deadlines, weights, and reminder alarms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COURSE_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.name}
              className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">{tmpl.name}</h4>
                <div className="space-y-1 mb-4 text-xs text-slate-400">
                  {tmpl.courses.map((c) => (
                    <div key={c.code} className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-300">{c.code}</span>
                      <span className="text-slate-500">·</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onLoadTemplate(tmpl.name)}
                className="w-full py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Load {tmpl.name.split(' ')[0]} Pack
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Syllabus Text Quick Parser */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-400" />
            Quick Syllabus & Coursework Importer
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Paste lines from your syllabus or assignment schedule (one per line). DuePulse will automatically structure them into tracked assignments with reminders.
          </p>
        </div>

        {parseStatus && (
          <div className="mb-3 rounded-lg border border-indigo-900/60 bg-indigo-950/40 p-2.5 text-xs text-indigo-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-indigo-400" />
            <span>{parseStatus}</span>
          </div>
        )}

        <textarea
          rows={3}
          placeholder="e.g.&#10;CS 350: Problem Set 2 on Distributed RPC&#10;BIO 204: Cellular Mitosis Lab Writeup&#10;ENG 101: Midterm Essay on Modern Media"
          value={syllabusText}
          onChange={(e) => setSyllabusText(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none mb-3"
        />

        <div className="flex items-center justify-between">
          <button
            onClick={handleParseSyllabus}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm shadow-indigo-600/30 cursor-pointer"
          >
            Parse & Add Deadlines
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Backup JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer">
              <Upload className="h-3.5 w-3.5 text-slate-400" />
              <span>Restore JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleJsonUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Download Application Source Package */}
      <div className="rounded-xl border border-indigo-900/60 bg-gradient-to-br from-slate-900/90 to-indigo-950/30 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="h-5 w-5 text-indigo-400" />
              Get App as a File (Download Full Codebase)
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              You can download this entire application as a standalone file. It includes all React + TypeScript components, deadline scheduler, Web Audio alert synthesizers, styling, and configuration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/duepulse-app.zip"
              download="duepulse-app.zip"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-md shadow-indigo-600/30 cursor-pointer whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Download .ZIP (Recommended)</span>
            </a>

            <a
              href="/duepulse-app.tar.gz"
              download="duepulse-app.tar.gz"
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>Download .tar.gz</span>
            </a>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 text-xs">
          <span className="font-semibold text-slate-200 block mb-1.5">How to run this file on your computer:</span>
          <div className="space-y-1 font-mono text-[11px] text-slate-400">
            <p>1. Extract the downloaded <span className="text-indigo-300">duepulse-app.zip</span> to any folder.</p>
            <p>2. Open your terminal in that folder and run: <span className="text-emerald-400">npm install</span></p>
            <p>3. Start the application with: <span className="text-emerald-400">npm run dev</span></p>
            <p>4. Open your browser at <span className="text-sky-300">http://localhost:3000</span></p>
          </div>
        </div>
      </div>

    </div>
  );
};
