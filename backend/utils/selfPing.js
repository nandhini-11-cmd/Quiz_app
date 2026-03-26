// utils/selfPing.js
// ─────────────────────────────────────────────────────────────────────────────
// This runs INSIDE your backend server.
// It pings itself every 14 minutes so Render/Railway never puts it to sleep.
// This works even when NO user has the frontend tab open.
//
// HOW TO USE: Import and call startSelfPing() in your server.js AFTER app.listen()
// ─────────────────────────────────────────────────────────────────────────────

import fetch from "node-fetch";

let pingInterval = null;

export const startSelfPing = (backendUrl) => {
  if (pingInterval) return; // already running

  const url = backendUrl || process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL;

  if (!url) {
    console.warn(
      "[SelfPing] ⚠️  No BACKEND_URL set. Self-ping disabled.\n" +
      "           Add BACKEND_URL=https://your-app.onrender.com to your env vars."
    );
    return;
  }

  const healthUrl = `${url.replace(/\/$/, "")}/api/health`;
  console.log(`[SelfPing] ✅ Started. Will ping ${healthUrl} every 14 minutes.`);

  const doPing = async () => {
    try {
      const res = await fetch(healthUrl, {
        method: "GET",
        timeout: 10000,
      });
      console.log(`[SelfPing] 🏓 Ping OK — ${new Date().toISOString()} (status: ${res.status})`);
    } catch (err) {
      console.warn("[SelfPing] ⚠️  Ping failed:", err.message);
    }
  };

  doPing(); // ping once immediately on startup
  pingInterval = setInterval(doPing, 14 * 60 * 1000); // every 14 minutes
};

export const stopSelfPing = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    console.log("[SelfPing] Stopped.");
  }
};
