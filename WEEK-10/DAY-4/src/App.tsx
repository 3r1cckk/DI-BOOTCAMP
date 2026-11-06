import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Filter,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  ArrowUpDown,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  Assignment,
  AssignmentStatus,
  AssignmentType,
  NotificationSettings,
  Priority,
  ReminderNotification,
} from './types/assignment';
import { getInitialAssignments, COURSE_TEMPLATES } from './data/sampleAssignments';
import { soundService } from './services/soundService';
import { notificationService } from './services/notificationService';
import { getUrgencyTier } from './utils/dateUtils';

import { Navbar } from './components/Navbar';
import { LiveUrgencyBanner } from './components/LiveUrgencyBanner';
import { StatBar } from './components/StatBar';
import { AssignmentCard } from './components/AssignmentCard';
import { AssignmentModal } from './components/AssignmentModal';
import { CalendarView } from './components/CalendarView';
import { ReminderDrawer } from './components/ReminderDrawer';
import { CourseSyncModal } from './components/CourseSyncModal';
import { RadarView } from './components/RadarView';
import { RedAlertModal } from './components/RedAlertModal';

const STORAGE_KEY = 'duepulse_student_assignments_v1';
const SETTINGS_KEY = 'duepulse_notification_settings_v1';
const NOTIFS_KEY = 'duepulse_notification_history_v1';

export default function App() {
  // Navigation tabs: 'dashboard' | 'radar' | 'calendar' | 'reminders' | 'courses'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'radar' | 'calendar' | 'reminders' | 'courses'>('dashboard');

  // Red Alert Modal & Danger Sound state
  const [redAlertAssignment, setRedAlertAssignment] = useState<Assignment | null>(null);
  const [isAlarmSounding, setIsAlarmSounding] = useState<boolean>(false);

  // Core Assignments State
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return getInitialAssignments();
  });

  // Notification Settings
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      soundEnabled: true,
      desktopEnabled: true,
      volume: 0.6,
      autoCheckIntervalSeconds: 30,
    };
  });

  // Triggered Notifications Log
  const [notifications, setNotifications] = useState<ReminderNotification[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Browser Notification Permission
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return notificationService.getPermission();
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'submitted' | 'critical'>('all');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'weight' | 'course'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Toast alert
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>(null);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [assignments]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Request desktop notification permission
  const handleRequestDesktopPermission = async () => {
    const res = await notificationService.requestPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      notificationService.dispatch({
        title: 'DuePulse Deadlines Enabled',
        body: 'You will receive proactive alerts before your assignments are due.',
      });
    }
  };

  // Toggle audio sound chime
  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    setSettings((prev) => ({ ...prev, soundEnabled: nextVal }));
    if (nextVal) {
      soundService.playReminderChime(settings.volume);
    }
  };

  // Toggle desktop notifications
  const handleToggleDesktopNotifications = async () => {
    if (notificationPermission !== 'granted') {
      await handleRequestDesktopPermission();
    } else {
      setSettings((prev) => ({ ...prev, desktopEnabled: !prev.desktopEnabled }));
    }
  };

  // Silence danger alarm
  const handleSilenceDangerAlarm = useCallback(() => {
    soundService.stopDangerAlarm();
    setIsAlarmSounding(false);
  }, []);

  // Main Reminder Poller Engine
  const checkUpcomingDeadlines = useCallback(() => {
    const now = Date.now();

    setAssignments((prevAssignments) => {
      let hasChanges = false;
      let triggeredDeadlineAssignment: Assignment | null = null;

      const updated = prevAssignments.map((assignment) => {
        if (assignment.status === 'submitted') return assignment;

        const dueTimestamp = new Date(assignment.dueDate).getTime();
        const diffMs = dueTimestamp - now;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        let updatedDismissedRedAlert = assignment.dismissedRedAlert;

        // Check if submission deadline has reached or passed! (diffMs <= 0)
        if (diffMs <= 0 && !assignment.dismissedRedAlert) {
          hasChanges = true;
          updatedDismissedRedAlert = true;
          if (!triggeredDeadlineAssignment) {
            triggeredDeadlineAssignment = assignment;
          }
        }

        const dismissed = assignment.dismissedReminders || [];
        const newDismissed = [...dismissed];

        assignment.reminderOffsets.forEach((offsetMinutes) => {
          // If within the window of this reminder tier and hasn't fired yet
          if (diffMinutes <= offsetMinutes && diffMinutes > offsetMinutes - 30 && !dismissed.includes(offsetMinutes)) {
            hasChanges = true;
            newDismissed.push(offsetMinutes);

            const label = offsetMinutes >= 60 ? `${Math.round(offsetMinutes / 60)} hours` : `${offsetMinutes} minutes`;
            const alertTitle = `Due Soon: ${assignment.courseCode} ${assignment.title}`;
            const alertBody = `Due in approximately ${label} (${new Date(assignment.dueDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})`;

            // Audio Chime
            if (settings.soundEnabled) {
              if (offsetMinutes <= 120) {
                soundService.playUrgentAlert(settings.volume);
              } else {
                soundService.playReminderChime(settings.volume);
              }
            }

            // Desktop Push Notification
            if (settings.desktopEnabled && notificationPermission === 'granted') {
              notificationService.dispatch({
                title: alertTitle,
                body: alertBody,
                tag: `${assignment.id}-${offsetMinutes}`,
              });
            }

            // In-app toast banner
            setToastMessage({ title: alertTitle, body: alertBody });

            // Record to Notification History
            const newNotif: ReminderNotification = {
              id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              assignmentId: assignment.id,
              assignmentTitle: assignment.title,
              courseCode: assignment.courseCode,
              dueDate: assignment.dueDate,
              offsetMinutes,
              label: `${label} before deadline`,
              timestamp: new Date().toISOString(),
              read: false,
            };

            setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
          }
        });

        if (hasChanges) {
          return {
            ...assignment,
            dismissedReminders: newDismissed,
            dismissedRedAlert: updatedDismissedRedAlert,
          };
        }
        return assignment;
      });

      // If a deadline reached right now: fire Red Alert & danger siren!
      if (triggeredDeadlineAssignment) {
        setRedAlertAssignment(triggeredDeadlineAssignment);
        setIsAlarmSounding(true);

        if (settings.soundEnabled) {
          soundService.startDangerAlarm(settings.volume);
        }

        if (settings.desktopEnabled && notificationPermission === 'granted') {
          notificationService.dispatch({
            title: `🚨 SUBMISSION TIME REACHED: ${(triggeredDeadlineAssignment as Assignment).courseCode}`,
            body: `Deadline arrived for ${(triggeredDeadlineAssignment as Assignment).title}! Submit now before portal closes.`,
          });
        }
      }

      return hasChanges ? updated : prevAssignments;
    });
  }, [settings, notificationPermission]);

  // Periodic timer for the reminder checker: runs frequently (every 2.5 seconds) for instant deadline detection
  useEffect(() => {
    checkUpcomingDeadlines();
    const interval = setInterval(() => {
      checkUpcomingDeadlines();
    }, 2500);

    return () => {
      clearInterval(interval);
      soundService.stopDangerAlarm();
    };
  }, [checkUpcomingDeadlines]);

  // Trigger Red Alert test simulation (modal + siren)
  const handleTriggerRedAlertTest = useCallback((target?: Assignment) => {
    const candidate =
      target ||
      assignments.find((a) => a.status !== 'submitted') ||
      assignments[0] || {
        id: 'test-emergency',
        title: 'Distributed Consensus Project Milestone',
        courseCode: 'CS 350',
        courseName: 'Distributed Systems',
        courseColor: 'indigo',
        type: 'project' as const,
        dueDate: new Date().toISOString(),
        priority: 'critical' as const,
        status: 'in_progress' as const,
        weightPercentage: 25,
        submissionPlatform: 'gradescope' as const,
        submissionUrl: 'https://www.gradescope.com',
        notes: 'Pass all 10 unit test suites. Run `go test -race` before uploading the zip archive.',
        subtasks: [],
        reminderOffsets: [60],
        createdAt: new Date().toISOString(),
      };

    setRedAlertAssignment(candidate);
    setIsAlarmSounding(true);

    if (settings.soundEnabled) {
      soundService.startDangerAlarm(settings.volume);
    }

    if (settings.desktopEnabled && notificationPermission === 'granted') {
      notificationService.dispatch({
        title: `🚨 SUBMISSION TIME REACHED: ${candidate.courseCode}`,
        body: `The deadline for ${candidate.title} has arrived! Submit immediately before portal locks.`,
      });
    }

    setToastMessage({
      title: `🚨 RED ALERT ACTIVE`,
      body: `${candidate.courseCode} submission time reached! Danger alarm sounding.`,
    });
  }, [assignments, settings, notificationPermission]);

  // Immediate Standard Alert Simulation
  const handleTriggerTestAlert = () => {
    const sample = assignments[0] || {
      id: 'test',
      title: 'Sample Assignment Submission',
      courseCode: 'CS 350',
      dueDate: new Date(Date.now() + 2 * 3600000).toISOString(),
    };

    if (settings.soundEnabled) {
      soundService.playReminderChime(settings.volume);
    }

    if (settings.desktopEnabled && notificationPermission === 'granted') {
      notificationService.dispatch({
        title: `Reminder: ${sample.courseCode} Assignment Due Soon`,
        body: `${sample.title} deadline is approaching! Verify submission checklist.`,
      });
    }

    setToastMessage({
      title: `Simulated Alert: ${sample.courseCode}`,
      body: `${sample.title} is approaching its deadline.`,
    });

    setNotifications((prev) => [
      {
        id: 'test-' + Date.now(),
        assignmentId: sample.id,
        assignmentTitle: sample.title,
        courseCode: sample.courseCode,
        dueDate: sample.dueDate,
        offsetMinutes: 120,
        label: 'Test simulation alert',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  };

  // Mark assignment as submitted with fanfare & confetti!
  const handleToggleStatus = (assignmentId: string) => {
    // Silence alarm if this was the active red alert
    if (redAlertAssignment?.id === assignmentId) {
      handleSilenceDangerAlarm();
      setRedAlertAssignment(null);
    }

    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id === assignmentId) {
          const willBeSubmitted = a.status !== 'submitted';
          if (willBeSubmitted) {
            // Trigger celebration fanfare sound
            soundService.playSubmissionFanfare(settings.volume);

            // Trigger confetti burst
            confetti({
              particleCount: 65,
              spread: 70,
              origin: { y: 0.7 },
              colors: ['#6366f1', '#10b981', '#f59e0b', '#38bdf8'],
            });

            return {
              ...a,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            };
          } else {
            return {
              ...a,
              status: 'in_progress',
              submittedAt: undefined,
            };
          }
        }
        return a;
      })
    );
  };

  // Toggle individual subtask
  const handleToggleSubtask = (assignmentId: string, subtaskId: string) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id === assignmentId) {
          const updatedSubtasks = a.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...a, subtasks: updatedSubtasks };
        }
        return a;
      })
    );
  };

  // Snooze reminder for assignment
  const handleSnooze = (assignmentId: string, minutes: number) => {
    handleSilenceDangerAlarm();
    if (redAlertAssignment?.id === assignmentId) {
      setRedAlertAssignment(null);
    }

    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id === assignmentId) {
          // Adjust reminder offsets and allow re-alert after snooze
          return {
            ...a,
            dismissedRedAlert: false,
            reminderOffsets: [minutes, ...a.reminderOffsets.filter((m) => m !== minutes)],
          };
        }
        return a;
      })
    );
    setToastMessage({
      title: 'Alert Snoozed',
      body: `Reminder pushed by ${minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}.`,
    });
  };

  // Save new or edited assignment
  const handleSaveAssignment = (assignmentData: Partial<Assignment>) => {
    if (editingAssignment) {
      setAssignments((prev) =>
        prev.map((a) => (a.id === editingAssignment.id ? ({ ...a, ...assignmentData } as Assignment) : a))
      );
    } else {
      const newAssignment: Assignment = {
        id: 'asg-' + Date.now(),
        title: assignmentData.title || 'Untitled Assignment',
        courseCode: assignmentData.courseCode || 'COURSE',
        courseName: assignmentData.courseName || 'Course',
        courseColor: 'indigo',
        type: assignmentData.type || 'problem_set',
        dueDate: assignmentData.dueDate || new Date().toISOString(),
        priority: assignmentData.priority || 'medium',
        status: 'not_started',
        weightPercentage: assignmentData.weightPercentage,
        submissionPlatform: assignmentData.submissionPlatform || 'canvas',
        submissionUrl: assignmentData.submissionUrl,
        notes: assignmentData.notes,
        subtasks: assignmentData.subtasks || [],
        reminderOffsets: assignmentData.reminderOffsets || [1440, 360, 60],
        createdAt: new Date().toISOString(),
      };
      setAssignments((prev) => [newAssignment, ...prev]);
    }
    setEditingAssignment(null);
  };

  // Delete assignment
  const handleDeleteAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  // Load Course Pack template
  const handleLoadTemplate = (templateName: string) => {
    const tmpl = COURSE_TEMPLATES.find((t) => t.name === templateName);
    if (!tmpl) return;

    const now = Date.now();
    const newAssignments: Assignment[] = tmpl.courses.map((c, idx) => ({
      id: `tmpl-${Date.now()}-${idx}`,
      title: `${c.code} Core Submission Milestone`,
      courseCode: c.code,
      courseName: c.name,
      courseColor: c.color,
      type: 'project',
      dueDate: new Date(now + (idx + 1) * 36 * 3600000).toISOString().split('.')[0],
      priority: idx === 0 ? 'critical' : 'high',
      status: 'in_progress',
      weightPercentage: 20,
      submissionPlatform: 'canvas',
      submissionUrl: 'https://canvas.instructure.com',
      notes: `Review guidelines on syllabus page for ${c.code}.`,
      reminderOffsets: [1440, 360, 60],
      subtasks: [
        { id: `st-tmpl-${idx}-1`, text: 'Read project brief & grading rubric', completed: true },
        { id: `st-tmpl-${idx}-2`, text: 'Complete draft implementation', completed: false },
        { id: `st-tmpl-${idx}-3`, text: 'Upload report to submission portal', completed: false },
      ],
      createdAt: new Date().toISOString(),
    }));

    setAssignments((prev) => [...newAssignments, ...prev]);
    setActiveTab('dashboard');
    setToastMessage({
      title: 'Course Pack Loaded',
      body: `Added ${tmpl.name} coursework into your schedule.`,
    });
  };

  // Bulk import from JSON or syllabus
  const handleImportAssignments = (newItems: Assignment[]) => {
    setAssignments((prev) => [...newItems, ...prev]);
    setActiveTab('dashboard');
  };

  // Filter & Sort Logic
  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = a.title.toLowerCase().includes(q);
          const matchesCourse = a.courseCode.toLowerCase().includes(q) || a.courseName.toLowerCase().includes(q);
          const matchesNotes = a.notes ? a.notes.toLowerCase().includes(q) : false;
          if (!matchesTitle && !matchesCourse && !matchesNotes) return false;
        }

        // Course filter
        if (selectedCourse !== 'ALL' && a.courseCode !== selectedCourse) {
          return false;
        }

        // Status filter
        if (selectedStatus === 'pending' && a.status === 'submitted') return false;
        if (selectedStatus === 'submitted' && a.status !== 'submitted') return false;
        if (selectedStatus === 'critical') {
          const urgency = getUrgencyTier(a.dueDate, a.status === 'submitted');
          if (urgency !== 'critical' && urgency !== 'overdue') return false;
        }

        // Type filter
        if (selectedType !== 'ALL' && a.type !== selectedType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'deadline') {
          comp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (sortBy === 'priority') {
          const rank: Record<Priority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          comp = rank[b.priority] - rank[a.priority];
        } else if (sortBy === 'weight') {
          comp = (b.weightPercentage || 0) - (a.weightPercentage || 0);
        } else if (sortBy === 'course') {
          comp = a.courseCode.localeCompare(b.courseCode);
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [assignments, searchQuery, selectedCourse, selectedStatus, selectedType, sortBy, sortOrder]);

  // Unique list of courses for filter dropdown
  const uniqueCourses = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a) => map.set(a.courseCode, a.courseName));
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [assignments]);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Universal Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewModal={() => {
          setEditingAssignment(null);
          setIsModalOpen(true);
        }}
        notificationSettings={settings}
        onToggleSound={handleToggleSound}
        onToggleDesktopNotifications={handleToggleDesktopNotifications}
        notificationPermission={notificationPermission}
        unreadRemindersCount={unreadNotifsCount}
        onTriggerRedAlert={() => handleTriggerRedAlertTest()}
      />

      {/* Floating In-App Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-indigo-500/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                {toastMessage.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1">{toastMessage.body}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Next Urgent Deadline Hero Banner */}
        <LiveUrgencyBanner
          assignments={assignments}
          onMarkSubmitted={handleToggleStatus}
          onOpenDetails={(a) => {
            setEditingAssignment(a);
            setIsModalOpen(true);
          }}
        />

        {/* 4-Column Stat Bar */}
        <StatBar assignments={assignments} />

        {/* View Switcher: Dashboard, Radar, Calendar, Reminders, Courses */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            
            {/* Filter and Search Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by assignment title, course, or instructions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Status Segmented Buttons */}
                  <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                    {(['all', 'pending', 'critical', 'submitted'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setSelectedStatus(st)}
                        className={`px-2.5 py-1 rounded capitalize transition-colors cursor-pointer ${
                          selectedStatus === st
                            ? 'bg-slate-800 text-white font-medium shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Course Dropdown */}
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">All Courses</option>
                    {uniqueCourses.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Type Filter */}
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">All Deliverables</option>
                    <option value="problem_set">Problem Sets</option>
                    <option value="project">Projects</option>
                    <option value="essay">Essays</option>
                    <option value="lab_report">Lab Reports</option>
                    <option value="reading">Readings</option>
                    <option value="quiz">Quizzes</option>
                  </select>

                  {/* Sort Controls */}
                  <div className="flex items-center border border-slate-700/80 rounded-lg overflow-hidden bg-slate-950">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'deadline' | 'priority' | 'weight' | 'course')}
                      className="border-none bg-transparent px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="deadline">Sort: Due Date</option>
                      <option value="priority">Sort: Priority</option>
                      <option value="weight">Sort: Grade Weight</option>
                      <option value="course">Sort: Course</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      title={`Toggle sort order (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
                      className="px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-l border-slate-800"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            </div>

            {/* Assignment List */}
            {filteredAssignments.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400 mb-3">
                  <Filter className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-white">No assignments match your filter</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Try clearing your search query, selecting &quot;All Courses&quot;, or creating a new assignment.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCourse('ALL');
                    setSelectedStatus('all');
                    setSelectedType('ALL');
                  }}
                  className="mt-4 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onToggleSubtask={handleToggleSubtask}
                    onToggleStatus={handleToggleStatus}
                    onEdit={(a) => {
                      setEditingAssignment(a);
                      setIsModalOpen(true);
                    }}
                    onDelete={handleDeleteAssignment}
                    onSnooze={handleSnooze}
                    onTriggerRedAlert={handleTriggerRedAlertTest}
                    onTestReminderAlert={(a) => {
                      if (settings.soundEnabled) soundService.playReminderChime(settings.volume);
                      if (settings.desktopEnabled && notificationPermission === 'granted') {
                        notificationService.dispatch({
                          title: `Deadline Alert: ${a.courseCode}`,
                          body: `${a.title} is due soon! Check submission requirements.`,
                        });
                      }
                      setToastMessage({
                        title: `Tested Chime & Alert`,
                        body: `${a.courseCode} - ${a.title}`,
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deadline Radar Tab */}
        {activeTab === 'radar' && (
          <RadarView
            assignments={assignments}
            onMarkSubmitted={handleToggleStatus}
            onOpenDetails={(a) => {
              setEditingAssignment(a);
              setIsModalOpen(true);
            }}
          />
        )}

        {/* Calendar View Tab */}
        {activeTab === 'calendar' && (
          <CalendarView
            assignments={assignments}
            onSelectAssignment={(a) => {
              setEditingAssignment(a);
              setIsModalOpen(true);
            }}
            onMarkSubmitted={handleToggleStatus}
          />
        )}

        {/* Reminders Log Tab */}
        {activeTab === 'reminders' && (
          <ReminderDrawer
            assignments={assignments}
            notifications={notifications}
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
            onRequestDesktopPermission={handleRequestDesktopPermission}
            desktopPermission={notificationPermission}
            onClearNotifications={() => setNotifications([])}
            onMarkNotificationRead={(id) =>
              setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
            }
            onTriggerTestAlert={handleTriggerTestAlert}
            onTriggerRedAlertTest={() => handleTriggerRedAlertTest()}
            onSnooze={handleSnooze}
          />
        )}

        {/* Course Sync Tab */}
        {activeTab === 'courses' && (
          <CourseSyncModal
            assignments={assignments}
            onImportAssignments={handleImportAssignments}
            onLoadTemplate={handleLoadTemplate}
          />
        )}

      </main>

      {/* Assignment Create / Edit Modal */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAssignment(null);
        }}
        onSave={handleSaveAssignment}
        assignmentToEdit={editingAssignment}
        existingCourses={uniqueCourses}
      />

      {/* Emergency Red Alert Modal for Deadline Reached */}
      <RedAlertModal
        assignment={redAlertAssignment}
        isOpen={Boolean(redAlertAssignment)}
        onClose={() => {
          handleSilenceDangerAlarm();
          setRedAlertAssignment(null);
        }}
        onSilenceAlarm={handleSilenceDangerAlarm}
        onMarkSubmitted={handleToggleStatus}
        onSnooze={handleSnooze}
        isAlarmSounding={isAlarmSounding}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DuePulse · Proactive Student Deadline Management & Audio Alerts</span>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('courses')}
              className="hover:text-slate-200 cursor-pointer"
            >
              Export iCal (.ics)
            </button>
            <span>·</span>
            <button
              onClick={handleTriggerTestAlert}
              className="hover:text-slate-200 cursor-pointer"
            >
              Test Notification
            </button>
            <span>·</span>
            <button
              onClick={() => handleTriggerRedAlertTest()}
              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Test Red Alert & Siren
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
