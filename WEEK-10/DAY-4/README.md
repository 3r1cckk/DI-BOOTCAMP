# DuePulse - Student Assignment & Deadline Reminder

Proactive deadline tracking and multi-tier submission reminders for students, featuring live countdowns, portal launch links, browser notifications, calendar sync, and emergency red alert danger sirens.

## Features

- **Multi-Tier Deadline Reminders**: Proactive alerts (48h, 24h, 6h, 2h, 1h, 15m, or custom offsets).
- **Emergency Red Alert & Danger Siren**: When a deadline reaches or expires, a flashing red alert modal appears and an emergency synthesized siren alerts you immediately.
- **Web Audio API Synthesizer**: Zero external dependencies; produces harmonic reminder chimes and sirens directly in the browser.
- **Direct Portal Links**: 1-click launch to Canvas, Gradescope, Blackboard, Google Classroom, Turnitin, Moodle, or custom URLs.
- **Milestones & Deliverables Checklist**: Interactive subtasks for each assignment.
- **Celebration Confetti & Fanfare**: Rewards you with sound effects and confetti upon on-time submission.
- **Multiple Views**: Dashboard, Deadline Radar, Visual Month Calendar, Reminders Log, and Course Sync.
- **iCalendar (.ics) Sync**: Export deadlines to Google Calendar, Apple Calendar, or Outlook.
- **Syllabus Importer & Course Packs**: Pre-loaded packs for Computer Science, Pre-Med, and Business.
- **Offline / Local Persistence**: Automatically saves coursework state in LocalStorage.

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```

The app will be accessible at `http://localhost:3000`.

### 3. Build for production
```bash
npm run build
```
