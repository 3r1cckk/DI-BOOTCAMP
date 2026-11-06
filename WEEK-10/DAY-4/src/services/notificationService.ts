/**
 * Browser Notification Service for desktop deadline alerts.
 */

export interface SystemNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export const notificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const res = await Notification.requestPermission();
      return res;
    } catch {
      return 'denied';
    }
  },

  dispatch(payload: SystemNotificationPayload): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        icon: '/favicon.ico',
      });
      return true;
    } catch (e) {
      console.warn('Desktop notification dispatch failed:', e);
      return false;
    }
  }
};
