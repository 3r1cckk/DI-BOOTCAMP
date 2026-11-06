export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type AssignmentStatus = 'not_started' | 'in_progress' | 'ready_for_submission' | 'submitted';

export type SubmissionPlatform = 'canvas' | 'gradescope' | 'blackboard' | 'classroom' | 'moodle' | 'turnitin' | 'custom';

export type AssignmentType = 'problem_set' | 'essay' | 'lab_report' | 'project' | 'reading' | 'quiz' | 'presentation';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  courseColor: string; // Tailwind color family e.g. 'indigo', 'emerald', 'sky', 'amber', 'rose', 'purple'
  type: AssignmentType;
  dueDate: string; // ISO string YYYY-MM-DDTHH:mm
  priority: Priority;
  status: AssignmentStatus;
  weightPercentage?: number;
  submissionPlatform: SubmissionPlatform;
  submissionUrl?: string;
  notes?: string;
  subtasks: Subtask[];
  reminderOffsets: number[]; // Minutes before deadline, e.g. [2880, 1440, 360, 60, 15]
  dismissedReminders?: number[]; // Offsets already triggered and dismissed
  dismissedRedAlert?: boolean; // Has red alert modal been shown for deadline reached
  submittedAt?: string;
  createdAt: string;
}

export interface ReminderNotification {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseCode: string;
  dueDate: string;
  offsetMinutes: number;
  label: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  desktopEnabled: boolean;
  volume: number; // 0.0 to 1.0
  autoCheckIntervalSeconds: number;
}
