import React from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Assignment, NotificationSettings, ReminderNotification } from '../types/assignment';
import { formatDueDateTime, getOffsetLabel } from '../utils/dateUtils';
import { soundService } from '../services/soundService';

interface ReminderDrawerProps {
  assignments: Assignment[];
  notifications: ReminderNotification[];
  settings: NotificationSettings;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void;
  onRequestDesktopPermission: () => void;
  desktopPermission: NotificationPermission;
  onClearNotifications: () => void;
  onMarkNotificationRead: (id: string) => void;
  onTriggerTestAlert: () => void;
  onTriggerRedAlertTest: () => void;
  onSnooze: (assignmentId: string, minutes: number) => void;
}

export const ReminderDrawer: React.FC<ReminderDrawerProps> = ({
  assignments,
  notifications,
  settings,
  onUpdateSettings,
  onRequestDesktopPermission,
  desktopPermission,
  onClearNotifications,
  onMarkNotificationRead,
  onTriggerTestAlert,
  onTriggerRedAlertTest,
  onSnooze,
}) => {
  // Collect all upcoming scheduled reminders across pending assignments
  const scheduledAlerts: {
    assignment: Assignment;
    offsetMinutes: number;
    triggerDate: Date;
    label: string;
  }[] = [];

  const now = Date.now();

  assignments
    .filter((a) => a.status !== 'submitted')
    .forEach((a) => {
      const dueTimestamp = new Date(a.dueDate).getTime();
      a.reminderOffsets.forEach((offset) => {
        const triggerTime = dueTimestamp - offset * 60 * 1000;
        if (triggerTime > now) {
          scheduledAlerts.push({
            assignment: a,
            offsetMinutes: offset,
            triggerDate: new Date(triggerTime),
            label: getOffsetLabel(offset),
          });
        }
      });
    });

  // Sort upcoming by trigger time
  scheduledAlerts.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());

  return (
    <div className="space-y-6">
      
      {/* Reminder Engine Controls Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-400" />
              Automated Deadline Reminder Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configured to send proactive alerts and emergency red alarms when submission time expires.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => soundService.playReminderChime(settings.volume)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400" />
              <span>Chime</span>
            </button>

            <button
              onClick={onTriggerTestAlert}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5 text-indigo-400" />
              <span>Standard Alert</span>
            </button>

            <button
              onClick={onTriggerRedAlertTest}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm shadow-rose-600/30 cursor-pointer animate-pulse-subtle"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Test Red Alert & Danger Siren</span>
            </button>
          </div>
        </div>

        {/* Settings grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          
          {/* Desktop Push Notification Status */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-slate-200 block mb-1">Desktop Notifications</span>
              <p className="text-[11px] text-slate-400 mb-2">
                Sends browser banner alerts even when this tab is in the background.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span
                className={`font-mono tabular-nums text-[11px] ${
                  desktopPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {desktopPermission === 'granted' ? 'Enabled (Active)' : 'Not Activated'}
              </span>
              {desktopPermission !== 'granted' && (
                <button
                  onClick={onRequestDesktopPermission}
                  className="px-2.5 py-1 text-[11px] font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded cursor-pointer"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* Sound Alert Toggle & Volume */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-slate-200 block mb-1">Audio Chime Alerts</span>
              <p className="text-[11px] text-slate-400 mb-2">
                Pleasant harmonic dual-tone chime on deadline milestones.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
                <span>Chime On</span>
              </label>

              <div className="flex items-center gap-1.5 w-24">
                <Volume2 className="h-3.5 w-3.5 text-slate-500" />
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={settings.volume}
                  onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Background Check Schedule */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-slate-200 block mb-1">Auto-Check Cadence</span>
              <p className="text-[11px] text-slate-400 mb-2">
                Active in-tab poller validates countdown thresholds every 30 seconds.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span>Status</span>
              <span className="font-mono tabular-nums text-emerald-400">Real-Time Polling</span>
            </div>
          </div>

        </div>
      </div>

      {/* Two columns: Scheduled Upcoming vs. Notification Log History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Next Scheduled Alerts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-400" />
                Scheduled Upcoming Reminders
              </h4>
              <p className="text-xs text-slate-400">
                Upcoming alert dispatches queued for your pending assignments.
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs text-slate-400">
              {scheduledAlerts.length} scheduled
            </span>
          </div>

          {scheduledAlerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No upcoming alert triggers queued. Add an assignment with reminder tiers.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {scheduledAlerts.map((sa, idx) => (
                <div
                  key={`${sa.assignment.id}-${sa.offsetMinutes}-${idx}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/50 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-200">{sa.assignment.courseCode}</span>
                      <span aria-hidden="true">·</span>
                      <span>{sa.label}</span>
                    </div>
                    <p className="font-medium text-white truncate">{sa.assignment.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Fires: {formatDueDateTime(sa.triggerDate.toISOString())}
                    </p>
                  </div>

                  <button
                    onClick={() => onSnooze(sa.assignment.id, 60)}
                    title="Push alert 1 hour later"
                    className="flex items-center gap-1 text-[11px] px-2 py-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded hover:border-slate-700 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Delay 1h</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Triggered Notification History */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-emerald-400" />
                Recent Dispatched Alerts
              </h4>
              <p className="text-xs text-slate-400">
                Log of recent audio and desktop alerts dispatched.
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={onClearNotifications}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No alert logs yet. Click &quot;Simulate Real Alert Now&quot; above to test.
            </p>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => onMarkNotificationRead(notif.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    notif.read
                      ? 'border-slate-800/60 bg-slate-950/30 text-slate-400'
                      : 'border-indigo-900/60 bg-indigo-950/25 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-white">{notif.courseCode} Alert</span>
                    <span className="font-mono tabular-nums text-[10px] text-slate-500">
                      {new Date(notif.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-300 font-medium">{notif.assignmentTitle}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Triggered: {notif.label} before due date ({formatDueDateTime(notif.dueDate)})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
