import { supabase } from "./supabaseClient";

let presenceInterval = null;

export function startPresenceTracking(userId) {
  if (!userId) return () => {};

  const update = async () => {
    try {
      await updateLastSeen();
    } catch (err) {
      console.error("Failed to update presence:", err);
    }
  };

  update();

  presenceInterval = setInterval(() => {
    update();
  }, 30000);

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      if (presenceInterval) clearInterval(presenceInterval);
      update();
      presenceInterval = setInterval(() => {
        update();
      }, 30000);
    } else {
      if (presenceInterval) clearInterval(presenceInterval);
      presenceInterval = null;
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (presenceInterval) {
      clearInterval(presenceInterval);
      presenceInterval = null;
    }
  };
}

export async function updateLastSeen() {
  try {
    await supabase.rpc("update_last_seen");
  } catch (err) {
    console.error("Failed to update last seen:", err);
  }
}

export function stopPresenceTracking() {
  if (presenceInterval) {
    clearInterval(presenceInterval);
    presenceInterval = null;
  }
}

export function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return "Offline";

  const date = new Date(lastSeenAt);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Online";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  const date = new Date(lastSeenAt);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  return seconds < 60;
}

export function subscribeToUserPresence(userId, callback) {
  const channel = supabase
    .channel(`user-presence-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
