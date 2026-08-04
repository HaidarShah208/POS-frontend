export type NotificationType = "order" | "kitchen" | "inventory" | "system" | "success" | "error" | "warning";
export type NotificationPriority = "low" | "medium" | "high";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
}
