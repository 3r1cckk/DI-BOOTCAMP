import React from 'react';
import { Bell, BellOff, Volume2, VolumeX, Plus, Calendar, LayoutGrid, Clock, BookOpen, AlertOctagon, Download } from 'lucide-react';
import { NotificationSettings } from '../types/assignment';

interface NavbarProps {
  activeTab: 'dashboard' | 'radar' | 'calendar' | 'reminders' | 'courses';
  setActiveTab: (tab: 'dashboard' | 'radar' | 'calendar' | 'reminders' | 'courses') => void;
  onOpenNewModal: () => void;
  notificationSettings: NotificationSettings;
  onToggleSound: () => void;
  onToggleDesktopNotifications: () => void;
  notificationPermission: NotificationPermission;
  unreadRemindersCount: number;
  onTriggerRedAlert?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewModal,
  notificationSettings,
  onToggleSound,
  onToggleDesktopNotifications,
  notificationPermission,
  unreadRemindersCount,
  onTriggerRedAlert,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left font-bold tracking-tight text-white hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <span className="text-lg">DuePulse</span>
            <span className="hidden sm:inline text-xs text-slate-400 font-normal ml-2">Student Deadline Engine</span>
          </button>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white cursor-pointer py-1 ${
              activeTab === 'dashboard' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              Assignments
            </span>
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white cursor-pointer py-1 ${
              activeTab === 'radar' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Deadline Radar
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white cursor-pointer py-1 ${
              activeTab === 'calendar' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Calendar
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white cursor-pointer py-1 relative ${
              activeTab === 'reminders' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Bell className="h-4 w-4" />
              Reminders
              {unreadRemindersCount > 0 && (
                <span className="font-mono text-xs bg-rose-500 text-white rounded-full px-1.5 py-0.2 leading-none">
                  {unreadRemindersCount}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white cursor-pointer py-1 ${
              activeTab === 'courses' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Course Sync
            </span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action + alert controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="/duepulse-app.zip"
            download="duepulse-app.zip"
            title="Download full project file as .zip"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors text-xs font-semibold"
          >
            <Download className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">Download App (.zip)</span>
          </a>

          {onTriggerRedAlert && (
            <button
              onClick={onTriggerRedAlert}
              title="Test Red Alert & Danger Siren"
              aria-label="Test Red Alert & Danger Siren"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-800/80 bg-rose-950/40 text-rose-300 hover:text-white hover:bg-rose-900/60 transition-colors cursor-pointer text-xs font-semibold"
            >
              <AlertOctagon className="h-4 w-4 text-rose-400 animate-pulse" />
              <span className="hidden sm:inline">Test Red Alert</span>
            </button>
          )}

          <button
            onClick={onToggleSound}
            title={notificationSettings.soundEnabled ? 'Chime sound enabled (Click to mute)' : 'Chime sound muted (Click to enable)'}
            aria-label="Toggle chime sound"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {notificationSettings.soundEnabled ? (
              <Volume2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={onToggleDesktopNotifications}
            title={
              notificationPermission === 'granted'
                ? 'Desktop notifications active'
                : 'Enable desktop notifications'
            }
            aria-label="Toggle desktop notifications"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {notificationPermission === 'granted' && notificationSettings.desktopEnabled ? (
              <Bell className="h-4 w-4 text-indigo-400" />
            ) : (
              <BellOff className="h-4 w-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Assignment</span>
          </button>
        </div>

      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950 px-2 py-2 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          <span>Tasks</span>
        </button>
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'radar' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Radar</span>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'calendar' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Calendar</span>
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex flex-col items-center gap-1 py-1 px-2 relative ${
            activeTab === 'reminders' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Alerts</span>
          {unreadRemindersCount > 0 && (
            <span className="absolute top-0 right-1 h-2 w-2 rounded-full bg-rose-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'courses' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Courses</span>
        </button>
      </div>
    </header>
  );
};
