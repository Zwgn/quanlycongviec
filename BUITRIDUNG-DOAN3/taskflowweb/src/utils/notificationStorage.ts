export type StoredNotification = {
  id: number;
  message: string;
  timeLabel: string;
  read: boolean;
};

const KEY_PREFIX = 'taskflow_notifications_';

export const loadNotifications = (userId: number | null | undefined): StoredNotification[] => {
  if (!userId) {
    return [];
  }

  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${userId}`);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as StoredNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

export const saveNotifications = (
  userId: number | null | undefined,
  notifications: StoredNotification[]
): void => {
  if (!userId) {
    return;
  }

  try {
    localStorage.setItem(`${KEY_PREFIX}${userId}`, JSON.stringify(notifications));
  } catch (_error) {
    // Ignore storage failures.
  }
};
