// src/lib/stores/notif.ts
import { writable, get } from 'svelte/store';

export interface Notification {
  id: string;
  type: 'flash' | 'stack' | 'sync';
  message: string;
  status?: 'load' | 'info' | 'error' | 'success';
  duration?: number;
  timestamp?: number;
}

// The actual writable store instance
const _notificationsWritable = writable<Notification[]>([]);

// Export the writable store directly as 'notificationsStore'
export const notificationsStore = _notificationsWritable;

const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
const generateId = () => `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;

function addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
  const newNotification = { ...notification, id: generateId(), timestamp: Date.now() };
  _notificationsWritable.update(currentNotifications => { // Update the actual writable instance
    console.log('Adding notification:', newNotification);
    const updated = [...currentNotifications, newNotification];
    console.log('Updated notifications array (after add):', updated);
    return updated;
  });
  return newNotification.id;
}

function removeNotification(id: string) {
  _notificationsWritable.update(currentNotifications => { // Update the actual writable instance
    console.log('Attempting to remove ID:', id);
    const updated = currentNotifications.filter(n => n.id !== id);
    console.log('Updated notifications array (after remove):', updated);
    return updated;
  });
}

// This object now only contains helper methods, not the subscribe method
// The subscribe method will be accessed directly from `notificationsStore`
export const notificationManager = {
  flash: (message: string, duration: number = 3000) => {
    const id = addNotification({ type: 'flash', message, duration });
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
    return id;
  },

  stack: (message: string, status?: 'load' | 'info' | 'error' | 'success', duration: number = 3500) => {
    const id = addNotification({ type: 'stack', message, status, duration });
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
    return id;
  },

  sync: (message: string, status?: 'load' | 'info' | 'error' | 'success') => {
    // Use get() on the actual writable instance
    const existingSync = get(_notificationsWritable).find(n => n.type === 'sync');

    if (existingSync) {
      _notificationsWritable.update(notifs => // Update the actual writable instance
        notifs.map(n =>
          n.id === existingSync.id ? { ...n, message: message, status: status || n.status } : n
        )
      );
      return existingSync.id;
    } else {
      return addNotification({ type: 'sync', message, status: status || 'load' });
    }
  },

  dismiss: removeNotification,
};