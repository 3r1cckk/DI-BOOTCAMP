import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Bell, Calendar, Clock, Globe } from 'lucide-react';
import {
  Assignment,
  AssignmentType,
  Priority,
  SubmissionPlatform,
  Subtask,
} from '../types/assignment';
import { REMINDER_OFFSET_PRESETS } from '../utils/dateUtils';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignmentData: Partial<Assignment>) => void;
  assignmentToEdit?: Assignment | null;
  existingCourses: { code: string; name: string }[];
}

const ASSIGNMENT_TYPES: { value: AssignmentType; label: string }[] = [
  { value: 'problem_set', label: 'Problem Set / Homework' },
  { value: 'project', label: 'Project / Coding' },
  { value: 'essay', label: 'Essay / Paper' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'reading', label: 'Reading & Discussion' },
  { value: 'quiz', label: 'Quiz / Exam Prep' },
  { value: 'presentation', label: 'Presentation / Slides' },
];

const PLATFORMS: { value: SubmissionPlatform; label: string; defaultUrl: string }[] = [
  { value: 'canvas', label: 'Canvas LMS', defaultUrl: 'https://canvas.instructure.com' },
  { value: 'gradescope', label: 'Gradescope', defaultUrl: 'https://www.gradescope.com' },
  { value: 'blackboard', label: 'Blackboard Learn', defaultUrl: 'https://blackboard.com' },
  { value: 'classroom', label: 'Google Classroom', defaultUrl: 'https://classroom.google.com' },
  { value: 'turnitin', label: 'Turnitin', defaultUrl: 'https://www.turnitin.com' },
  { value: 'moodle', label: 'Moodle', defaultUrl: 'https://moodle.org' },
  { value: 'custom', label: 'Custom / Other Portal', defaultUrl: '' },
];

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assignmentToEdit,
  existingCourses,
}) => {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [type, setType] = useState<AssignmentType>('problem_set');
  const [dueDateDate, setDueDateDate] = useState('');
  const [dueDateTime, setDueDateTime] = useState('23:59');
  const [priority, setPriority] = useState<Priority>('medium');
  const [weightPercentage, setWeightPercentage] = useState<string>('10');
  const [submissionPlatform, setSubmissionPlatform] = useState<SubmissionPlatform>('canvas');
  const [submissionUrl, setSubmissionUrl] = useState('https://canvas.instructure.com');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([1440, 360, 60]); // 24h, 6h, 1h
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (assignmentToEdit) {
      setTitle(assignmentToEdit.title);
      setCourseCode(assignmentToEdit.courseCode);
      setCourseName(assignmentToEdit.courseName);
      setType(assignmentToEdit.type);
      
      const [d, t] = assignmentToEdit.dueDate.split('T');
      setDueDateDate(d || '');
      setDueDateTime(t || '23:59');

      setPriority(assignmentToEdit.priority);
      setWeightPercentage(assignmentToEdit.weightPercentage ? String(assignmentToEdit.weightPercentage) : '');
      setSubmissionPlatform(assignmentToEdit.submissionPlatform);
      setSubmissionUrl(assignmentToEdit.submissionUrl || '');
      setNotes(assignmentToEdit.notes || '');
      setSubtasks(assignmentToEdit.subtasks || []);
      setSelectedOffsets(assignmentToEdit.reminderOffsets || [1440, 360, 60]);
    } else {
      // Defaults for new assignment
      setTitle('');
      if (existingCourses.length > 0) {
        setCourseCode(existingCourses[0].code);
        setCourseName(existingCourses[0].name);
      } else {
        setCourseCode('CS 101');
        setCourseName('Introduction to Computing');
      }
      setType('problem_set');

      // Default due date: tomorrow at 11:59 PM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setDueDateDate(`${yyyy}-${mm}-${dd}`);
      setDueDateTime('23:59');

      setPriority('medium');
      setWeightPercentage('10');
      setSubmissionPlatform('canvas');
      setSubmissionUrl('https://canvas.instructure.com');
      setNotes('');
      setSubtasks([]);
      setSelectedOffsets([1440, 360, 60]);
    }
    setErrorMsg('');
  }, [assignmentToEdit, isOpen, existingCourses]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: 'st-' + Date.now(), text: newSubtaskText.trim(), completed: false },
    ]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleToggleOffset = (minutes: number) => {
    if (selectedOffsets.includes(minutes)) {
      setSelectedOffsets(selectedOffsets.filter((m) => m !== minutes));
    } else {
      setSelectedOffsets([...selectedOffsets, minutes].sort((a, b) => b - a));
    }
  };

  const handleCourseSelect = (code: string) => {
    setCourseCode(code);
    const found = existingCourses.find((c) => c.code === code);
    if (found) {
      setCourseName(found.name);
    }
  };

  const handlePlatformChange = (p: SubmissionPlatform) => {
    setSubmissionPlatform(p);
    const match = PLATFORMS.find((plat) => plat.value === p);
    if (match && match.defaultUrl) {
      setSubmissionUrl(match.defaultUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter an assignment title.');
      return;
    }
    if (!courseCode.trim()) {
      setErrorMsg('Please enter a course code.');
      return;
    }
    if (!dueDateDate) {
      setErrorMsg('Please select a due date.');
      return;
    }

    const fullDueISO = `${dueDateDate}T${dueDateTime || '23:59'}`;

    onSave({
      title: title.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim() || courseCode.trim().toUpperCase(),
      type,
      dueDate: fullDueISO,
      priority,
      weightPercentage: weightPercentage ? parseFloat(weightPercentage) : undefined,
      submissionPlatform,
      submissionUrl: submissionUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      subtasks,
      reminderOffsets: selectedOffsets,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">
              {assignmentToEdit ? 'Edit Assignment & Reminders' : 'Track New Assignment'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Set deadlines, submission portal links, and automated multi-tier alert schedules.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Assignment Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assignment Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lab Report 3: Gel Electrophoresis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Course Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Course Code <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. CS 350"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              {existingCourses.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {existingCourses.slice(0, 4).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCourseSelect(c.code)}
                      className="text-[11px] text-slate-400 hover:text-indigo-300 cursor-pointer underline underline-offset-2"
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Course Name
              </label>
              <input
                type="text"
                placeholder="e.g. Distributed Systems"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Due Date <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dueDateDate}
                  onChange={(e) => setDueDateDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Due Time
              </label>
              <input
                type="time"
                value={dueDateTime}
                onChange={(e) => setDueDateTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Type, Priority, & Grade Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssignmentType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {ASSIGNMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="critical">Critical (Highest)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Final Grade Weight (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 15"
                value={weightPercentage}
                onChange={(e) => setWeightPercentage(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Submission Portal & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Submission Platform
              </label>
              <select
                value={submissionPlatform}
                onChange={(e) => handlePlatformChange(e.target.value as SubmissionPlatform)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Submission URL / Portal Link
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://canvas.instructure.com/courses/..."
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Reminder Schedule Offsets */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200 mb-2">
              <Bell className="h-4 w-4 text-indigo-400" />
              <span>Multi-Tier Reminder Alarms</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Select when you want proactive notifications and audio alarms before this deadline:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REMINDER_OFFSET_PRESETS.map((p) => {
                const isSelected = selectedOffsets.includes(p.minutes);
                return (
                  <button
                    key={p.minutes}
                    type="button"
                    onClick={() => handleToggleOffset(p.minutes)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/60 text-indigo-200 font-medium'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks / Deliverables Breakdown */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Subtasks & Deliverables Checklist
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add subtask (e.g. Write methodology section, Run unit tests)"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Add Step
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 pl-1 max-h-36 overflow-y-auto">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between text-xs bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="text-slate-200 truncate">{st.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-500 hover:text-rose-400 ml-2 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes / Special Instructions */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Submission Notes / Professor Guidelines
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Include cover page with student ID; file must be named LastName_First_A2.pdf"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm shadow-indigo-600/30 cursor-pointer"
            >
              {assignmentToEdit ? 'Save Changes' : 'Create & Schedule Reminders'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
