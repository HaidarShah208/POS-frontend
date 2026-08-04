import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { NotificationState, AppNotification, NotificationType, NotificationPriority } from "@/types/notification";
import { loadFromStorage, saveToStorage } from "@/lib/localStorage";

const KEY = "pos-notifications";
const MAX_NOTIFICATIONS = 100;
const FALLBACK: NotificationState = { notifications: [], unreadCount: 0 };

function loadState(): NotificationState {
  const stored = loadFromStorage<NotificationState>(KEY, FALLBACK);
  return { ...stored, unreadCount: stored.notifications.filter((n) => !n.read).length };
}

function persist(state: NotificationState) { saveToStorage(KEY, state); }

const notificationSlice = createSlice({
  name: "notifications",
  initialState: loadState(),
  reducers: {
    addNotification(state, action: PayloadAction<{ type: NotificationType; title: string; message: string; priority?: NotificationPriority; actionUrl?: string }>) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: action.payload.type,
        title: action.payload.title,
        message: action.payload.message,
        priority: action.payload.priority ?? "low",
        read: false,
        actionUrl: action.payload.actionUrl,
        createdAt: new Date().toISOString(),
      };
      state.notifications.unshift(notif);
      if (state.notifications.length > MAX_NOTIFICATIONS) state.notifications = state.notifications.slice(0, MAX_NOTIFICATIONS);
      state.unreadCount = state.notifications.filter((n) => !n.read).length;
      persist(state);
    },
    markAsRead(state, action: PayloadAction<string>) {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif && !notif.read) {
        notif.read = true;
        state.unreadCount = state.notifications.filter((n) => !n.read).length;
        persist(state);
      }
    },
    markAllAsRead(state) {
      state.notifications.forEach((n) => { n.read = true; });
      state.unreadCount = 0;
      persist(state);
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      state.unreadCount = state.notifications.filter((n) => !n.read).length;
      persist(state);
    },
    clearAll(state) {
      state.notifications = [];
      state.unreadCount = 0;
      persist(state);
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, removeNotification, clearAll } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;
