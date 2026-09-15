import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUnreadNotificationCount,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
  formatRelativeTime,
  getNotificationRoute,
  getNotificationIcon,
} from "../lib/notificationUtils";
import { sendBrowserNotification } from "../lib/notifications.js";

export function NotificationBell({ userId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    loadNotifications();
    
    const unsubscribe = subscribeToNotifications(userId, (newNotification) => {
      console.log("New notification received:", newNotification);
      setNotifications((prev) => {
        // Avoid duplicates
        if (prev.some((n) => n.id === newNotification.id)) return prev;
        return [newNotification, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
      
      // Send browser notification when a new notification arrives
      if (Notification.permission === 'granted') {
        sendBrowserNotification(
          newNotification.title,
          newNotification.message || "You have a new notification"
        );
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (unreadCount > 0 && typeof navigator.setAppBadge === "function") {
      navigator.setAppBadge(unreadCount).catch(() => {});
    } else if (unreadCount === 0 && typeof navigator.clearAppBadge === "function") {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [unreadCount]);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError(null);
      const [count, list] = await Promise.all([
        getUnreadNotificationCount(userId),
        fetchNotifications(userId),
      ]);
      setUnreadCount(count);
      setNotifications(list);
      console.log("Notifications loaded:", list.length, "unread:", count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  const [selectedNotification, setSelectedNotification] = useState(null);

  async function handleNotificationClick(notification) {
    try {
      await markNotificationRead(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setSelectedNotification(notification);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  function closeNotificationDetail() {
    setSelectedNotification(null);
    setOpen(false);
  }

  function handleNotificationView() {
    if (!selectedNotification) return;
    const route = getNotificationRoute(selectedNotification);
    if (selectedNotification.type === 'marketing' || !route || route === '/notifications') {
      closeNotificationDetail();
      return;
    }
    navigate(route);
    closeNotificationDetail();
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead(userId);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-surfacealt transition"
        aria-label="Notifications"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && !selectedNotification && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-hairline bg-white shadow-lg z-50">
          <div className="border-b border-hairline px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-seal hover:text-seal/80 transition font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-muted">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted">No notifications yet</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full border-b border-hairline px-4 py-3 text-left transition hover:bg-surfacealt ${
                    !notification.read_at ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink line-clamp-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted line-clamp-2 mt-0.5">
                        {notification.message || notification.body || "You have a new update."}
                      </p>
                      <p className="text-xs text-muted mt-1">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {selectedNotification && (
        <div className="fixed inset-x-3 top-[calc(4.75rem+env(safe-area-inset-top))] z-[60] max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-hairline bg-white p-4 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-none sm:w-96 sm:rounded-xl sm:shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getNotificationIcon(selectedNotification.type)}</span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Notification</p>
                <h3 className="mt-1 font-display text-xl font-bold text-ink">{selectedNotification.title}</h3>
              </div>
            </div>
            <button onClick={closeNotificationDetail} className="font-mono text-xs text-muted hover:text-ink">Close</button>
          </div>

          <div className="mt-4 rounded-xl border border-hairline bg-surfacealt p-3">
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
              {selectedNotification.message || selectedNotification.body || 'No message content was attached to this notification.'}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(selectedNotification.type !== 'marketing' && getNotificationRoute(selectedNotification)) ? (
              <button
                onClick={handleNotificationView}
                className="rounded-full bg-seal px-4 py-2 font-mono text-xs font-semibold text-surface hover:bg-seal-deep"
              >
                View
              </button>
            ) : (
              <button
                onClick={closeNotificationDetail}
                className="rounded-full bg-seal px-4 py-2 font-mono text-xs font-semibold text-surface hover:bg-seal-deep"
              >
                Close
              </button>
            )}
            <button
              onClick={closeNotificationDetail}
              className="rounded-full border border-hairline px-4 py-2 font-mono text-xs text-ink hover:border-marigold-deep hover:text-marigold-deep"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
