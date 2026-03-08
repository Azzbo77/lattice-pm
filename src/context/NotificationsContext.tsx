// ── NotificationsContext ──────────────────────────────────────────────────────
// Owns: in-app notifications derived from tasks + announcements

import {
  createContext, useState, useContext, useCallback,
  useMemo, ReactNode,
} from "react";
import { todayStr, addDays } from "../utils/dateHelpers";
import type { Task, Announcement, Notification, User } from "../types";

export interface NotificationsContextType {
  notifications:           Notification[];
  dismissNotification:     (id: string) => void;
  dismissAllNotifications: () => void;
}

export const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotifications = (): NotificationsContextType => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
};

export const NotificationsProvider = ({
  children,
  tasks,
  announcements,
  currentUser,
}: {
  children:      ReactNode;
  tasks:         Task[];
  announcements: Announcement[];
  currentUser:   User | null;
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const notifications = useMemo<Notification[]>(() => {
    const today = todayStr();
    const soon  = addDays(today, 3);
    const myTasks = currentUser?.role === "shopfloor"
      ? tasks.filter(t => t.assigneeId === currentUser!.id)
      : tasks;

    const taskNotifs = myTasks.reduce<Notification[]>((acc, t) => {
      if (t.status === "done" || !t.endDate) return acc;
      if (t.endDate < today) {
        acc.push({ id: `od-${t.id}`, text: `"${t.title}" is overdue`, type: "overdue", taskId: t.id });
      } else if (t.endDate <= soon) {
        acc.push({ id: `sn-${t.id}`, text: `"${t.title}" is due soon`, type: "soon", taskId: t.id });
      }
      return acc;
    }, []);

    const mentionNotifs: Notification[] = [];
    if (currentUser?.name) {
      const mention = `@${currentUser.name}`;
      announcements
        .filter(a => !a.expires || a.expires >= today)
        .forEach(a => {
          if (a.body.includes(mention) || a.title.includes(mention)) {
            mentionNotifs.push({
              id:             `mn-${a.id}`,
              text:           `You were mentioned in "${a.title}"`,
              type:           "mention",
              announcementId: a.id,
            });
          }
        });
    }

    return [...taskNotifs, ...mentionNotifs].filter(n => !dismissedIds.includes(n.id));
  }, [tasks, announcements, currentUser, dismissedIds]);

  const dismissNotification     = useCallback((id: string) => setDismissedIds(p => [...p, id]), []);
  const dismissAllNotifications = useCallback(() => setDismissedIds(notifications.map(n => n.id)), [notifications]);

  return (
    <NotificationsContext.Provider value={{ notifications, dismissNotification, dismissAllNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};
