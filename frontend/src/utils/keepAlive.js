// src/utils/keepAlive.js
// Prevents free-tier backend (Render/Railway) from cold-starting during user sessions
// Place this in your src/utils/ folder and call startKeepAlive() in App.jsx

const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://your-backend.onrender.com"; // ← replace with your actual backend URL if env not set

let keepAliveInterval = null;

const ping = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    if (res.ok) {
      console.log("[KeepAlive] ✅ Backend is awake");
    }
  } catch (err) {
    // Silently ignore - don't disturb user experience
    console.warn("[KeepAlive] ping failed (backend may be waking up):", err.message);
  }
};

export const startKeepAlive = () => {
  if (keepAliveInterval) return; // already running

  console.log("[KeepAlive] Starting keep-alive pings every 14 minutes");
  ping(); // ping immediately on app load
  keepAliveInterval = setInterval(ping, 14 * 60 * 1000); // every 14 minutes
};

export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log("[KeepAlive] Stopped");
  }
};
