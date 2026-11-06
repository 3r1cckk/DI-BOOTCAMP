import { Assignment } from '../types/assignment';

export function getInitialAssignments(): Assignment[] {
  const now = new Date();

  // Helper to construct ISO dates relative to now
  const addHours = (hours: number): string => {
    const d = new Date(now.getTime() + hours * 60 * 60 * 1000);
    // Format YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hh}:${mm}`;
  };

  return [
    {
      id: 'asg-1',
      title: 'Raft Distributed Consensus: Leader Election & Log Replication',
      courseCode: 'CS 350',
      courseName: 'Distributed Systems',
      courseColor: 'indigo',
      type: 'project',
      dueDate: addHours(6.5), // Due tonight!
      priority: 'critical',
      status: 'in_progress',
      weightPercentage: 25,
      submissionPlatform: 'gradescope',
      submissionUrl: 'https://www.gradescope.com',
      notes: 'Pass all 10 unit test suites. Run `go test -race` before uploading the zip archive.',
      reminderOffsets: [2880, 1440, 360, 120, 60, 15],
      subtasks: [
        { id: 'st-1-1', text: 'Implement Heartbeat timer reset logic', completed: true },
        { id: 'st-1-2', text: 'Handle RequestVote RPC edge cases', completed: true },
        { id: 'st-1-3', text: 'Pass network partition test 2C', completed: false },
        { id: 'st-1-4', text: 'Run race detector and generate submission zip', completed: false },
      ],
      createdAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
    },
    {
      id: 'asg-2',
      title: 'Lab Report 4: CRISPR-Cas9 Gel Electrophoresis Analysis',
      courseCode: 'BIO 204',
      courseName: 'Molecular Genetics',
      courseColor: 'emerald',
      type: 'lab_report',
      dueDate: addHours(26), // Tomorrow evening
      priority: 'high',
      status: 'in_progress',
      weightPercentage: 15,
      submissionPlatform: 'canvas',
      submissionUrl: 'https://canvas.instructure.com',
      notes: 'Must include high-contrast gel band photography and comparative lane intensity graphs.',
      reminderOffsets: [2880, 1440, 360, 60],
      subtasks: [
        { id: 'st-2-1', text: 'Annotate molecular ladder lanes in ImageJ', completed: true },
        { id: 'st-2-2', text: 'Draft results section with cleavage efficiency', completed: false },
        { id: 'st-2-3', text: 'Compile peer-reviewed citations in APA 7th', completed: false },
      ],
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: 'asg-3',
      title: 'Problem Set 7: Stokes\' Theorem & Surface Flux Integrals',
      courseCode: 'MATH 240',
      courseName: 'Multivariable Calculus',
      courseColor: 'sky',
      type: 'problem_set',
      dueDate: addHours(72), // In 3 days
      priority: 'medium',
      status: 'not_started',
      weightPercentage: 10,
      submissionPlatform: 'gradescope',
      submissionUrl: 'https://www.gradescope.com',
      notes: 'Handwritten work must be scanned using Adobe Scan / CamScanner with clear question page indexing.',
      reminderOffsets: [1440, 360, 60],
      subtasks: [
        { id: 'st-3-1', text: 'Complete textbook exercises 16.7: 1-12', completed: false },
        { id: 'st-3-2', text: 'Verify cross products in problem 9', completed: false },
        { id: 'st-3-3', text: 'Scan to single PDF and assign question pages', completed: false },
      ],
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: 'asg-4',
      title: 'Research Paper Draft: Algorithmic Accountability in Public Housing',
      courseCode: 'ENG 115',
      courseName: 'Academic Writing & Ethics',
      courseColor: 'rose',
      type: 'essay',
      dueDate: addHours(120), // In 5 days
      priority: 'medium',
      status: 'not_started',
      weightPercentage: 20,
      submissionPlatform: 'turnitin',
      submissionUrl: 'https://www.turnitin.com',
      notes: '2,500 words minimum. Include at least 6 scholarly sources published after 2022.',
      reminderOffsets: [2880, 1440, 360, 60],
      subtasks: [
        { id: 'st-4-1', text: 'Formulate thesis statement and 3 core pillars', completed: true },
        { id: 'st-4-2', text: 'Synthesize literature review notes', completed: false },
        { id: 'st-4-3', text: 'Draft section on discriminatory bias metrics', completed: false },
      ],
      createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: 'asg-5',
      title: 'Weekly Seminar Synthesis: Cognitive Heuristics in Economics',
      courseCode: 'PSYC 101',
      courseName: 'Introductory Psychology',
      courseColor: 'amber',
      type: 'reading',
      dueDate: addHours(168), // Next week
      priority: 'low',
      status: 'not_started',
      weightPercentage: 5,
      submissionPlatform: 'moodle',
      submissionUrl: 'https://moodle.org',
      notes: 'Post response to discussion forum and reply to at least two classmates.',
      reminderOffsets: [1440, 360],
      subtasks: [
        { id: 'st-5-1', text: 'Read Kahneman & Tversky (1974) chapter 4', completed: false },
        { id: 'st-5-2', text: 'Draft 400-word critical reflection post', completed: false },
      ],
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: 'asg-6',
      title: 'Milestone 1: Client-Server RPC Stubs & RPC Serialization',
      courseCode: 'CS 350',
      courseName: 'Distributed Systems',
      courseColor: 'indigo',
      type: 'project',
      dueDate: addHours(-18), // Submitted yesterday
      priority: 'high',
      status: 'submitted',
      weightPercentage: 10,
      submissionPlatform: 'gradescope',
      submissionUrl: 'https://www.gradescope.com',
      notes: 'Submitted ahead of schedule with 100% test pass score.',
      reminderOffsets: [1440, 360, 60],
      subtasks: [
        { id: 'st-6-1', text: 'Implement byte buffer serialization', completed: true },
        { id: 'st-6-2', text: 'Submit to auto-grader', completed: true },
      ],
      submittedAt: new Date(now.getTime() - 20 * 3600000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
    },
  ];
}

export const COURSE_TEMPLATES = [
  {
    name: 'Computer Science Major',
    courses: [
      { code: 'CS 350', name: 'Distributed Systems', color: 'indigo' },
      { code: 'CS 320', name: 'Database Systems & Query Engines', color: 'sky' },
      { code: 'MATH 240', name: 'Multivariable Calculus & Linear Algebra', color: 'emerald' },
      { code: 'CS 189', name: 'Machine Learning Fundamentals', color: 'purple' },
    ],
  },
  {
    name: 'Pre-Med & Biological Sciences',
    courses: [
      { code: 'BIO 204', name: 'Molecular Genetics & Lab', color: 'emerald' },
      { code: 'CHEM 220', name: 'Organic Chemistry II', color: 'amber' },
      { code: 'PHYS 101', name: 'Biophysics & Mechanics', color: 'sky' },
      { code: 'PSYC 101', name: 'Cognitive Behavioral Psychology', color: 'rose' },
    ],
  },
  {
    name: 'Business & Finance',
    courses: [
      { code: 'FIN 310', name: 'Corporate Valuation & Modeling', color: 'emerald' },
      { code: 'ACCT 201', name: 'Financial Accounting & Reporting', color: 'sky' },
      { code: 'ECON 202', name: 'Intermediate Macroeconomics', color: 'amber' },
      { code: 'MKTG 350', name: 'Digital Marketing & Growth', color: 'purple' },
    ],
  },
];
