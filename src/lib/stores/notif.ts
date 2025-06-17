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
export const wrt = writable<Notification[]>([]);

const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
const generateId = () => `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;

function addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
  const newNotification = { ...notification, id: generateId(), timestamp: Date.now() };
  wrt.update(currentNotifications => { 
    const updated = [...currentNotifications, newNotification];
    // console.log('Updated notifications array (after add):', updated);
    return updated;
  });
  return newNotification.id;
}

function removeNotification(id: string) {
  wrt.update(currentNotifications => { 
    const updated = currentNotifications.filter(n => n.id !== id);
    // console.log('Updated notifications array (after remove):', updated);
    return updated;
  });
}

export const alerting = {
  flash: (message: string, duration: number = 6000) => {
    
    const id = addNotification({ type: 'flash', message, duration });
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
    return id;
  },

  stack: (message: string, status?: 'load' | 'info' | 'error' | 'success', duration: number = 8000) => {
    
    const id = addNotification({ type: 'stack', message, status, duration });
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
    return id;
  },

  sync: (message: string, status: 'load' | 'info' | 'error' | 'success'='info',
    override: boolean = false) => {
    const existingSync = get(wrt).find(n => n.type === 'sync');
    if (status === "success" && existingSync) {
        setTimeout(() => removeNotification(existingSync.id), 2000);
        return;
    }
    
    if (existingSync) {
      wrt.update(notifs => // Update the actual writable instance
        notifs.map(n => {
          if (n.id === existingSync.id) {
            let updatedMessage = n.message;
            updatedMessage = override? message :n.message +"<br/>"+ message;
            const updatedStatus = status !== undefined && status !== null ? status : n.status;
            return { ...n, message: updatedMessage, status: updatedStatus };
          }
          return n;
        })
      );
      return;
    } else {
      const id = addNotification({ type: 'sync', message, status });
      console.log('add sync',id)
      return id;
    }
  },
  dismiss: removeNotification,
};