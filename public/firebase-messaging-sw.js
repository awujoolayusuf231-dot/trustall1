importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDX-XgxZm4RwVNNdZMYwZK-wN5jPgA7u2k",
  authDomain: "trustall-technology-limited.firebaseapp.com",
  projectId: "trustall-technology-limited",
  storageBucket: "trustall-technology-limited.firebasestorage.app",
  messagingSenderId: "155302285805",
  appId: "1:155302285805:web:c6ec674dd11ce5c32b17e4"
});

const messaging = firebase.messaging();

/**
 * Handle background messages from Firebase Cloud Messaging
 * Displays a notification to the user even if the app is not in focus
 */
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);
  
  const { title, body } = payload.notification || {};
  const data = payload.data || {};
  
  // Extract deep link from notification data
  const actionUrl = data.actionUrl || data.click_action || "/";
  
  const notificationOptions = {
    body: body || "New notification",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag || "trustall-notification", // Prevents duplicate notifications
    requireInteraction: false, // Auto-dismiss after a while
  };

  // Add click action handling
  if (actionUrl) {
    notificationOptions.data = { url: actionUrl };
  }

  // Add image if available
  if (data.imageUrl) {
    notificationOptions.image = data.imageUrl;
  }

  // Add priority if specified
  if (data.priority) {
    notificationOptions.requireInteraction = data.priority === "high";
  }

  self.registration.showNotification(title || "Trustall", notificationOptions);

  // Badging support varies between browser page and service-worker contexts.
  const badgeCount = data.unreadCount ? parseInt(data.unreadCount, 10) : 1;
  if (Number.isFinite(badgeCount)) {
    if (typeof self.registration.setAppBadge === "function") {
      self.registration.setAppBadge(badgeCount).catch(() => {});
    } else if (self.navigator && typeof self.navigator.setAppBadge === "function") {
      self.navigator.setAppBadge(badgeCount).catch(() => {});
    }
  }
});

/**
 * Handle notification clicks
 * Routes the user to the appropriate page when they click on a notification
 */
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const url = notificationData.url || "/";

  // Try to find existing window with the app open
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === "/" || client.url.includes(window.location.host)) {
            // App window found, navigate it
            return client.navigate(url).then((client) => {
              if (client) client.focus();
            });
          }
        }
        // App not open, open new window
        return clients.openWindow(url);
      })
  );
});

/**
 * Handle notification dismissals (optional)
 */
self.addEventListener("notificationclose", (event) => {
  console.log("Notification dismissed:", event.notification);
  // Optional: track analytics, etc.
});

/**
 * Push event handler as fallback
 */
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event received with no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("Push event data:", data);
    
    // If it's a Firebase notification, let the onBackgroundMessage handler deal with it
    // This is just a fallback for other push events
    if (data.notification) {
      const notificationOptions = {
        body: data.notification.body || "New notification",
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: "trustall-notification",
      };

      event.waitUntil(
        self.registration.showNotification(data.notification.title || "Trustall", notificationOptions)
      );
    }
  } catch (error) {
    console.error("Error handling push event:", error);
  }
});
