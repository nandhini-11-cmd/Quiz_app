// src/components/UserAvatar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Safe avatar component — generates a colored letter avatar as fallback.
// NEVER causes infinite re-render or repeated GET requests for broken images.
//
// Usage:
//   <UserAvatar username="Nandhini" avatar={user.avatar} size={40} />
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

// Generate a consistent color from a username string
const getAvatarColor = (username) => {
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
  ];
  if (!username) return colors[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const LetterAvatar = ({ username, size }) => {
  const letter = (username || "?")[0].toUpperCase();
  const bg = getAvatarColor(username);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "bold",
        fontSize: size * 0.4,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {letter}
    </div>
  );
};

const UserAvatar = ({ username, avatar, size = 40, className = "" }) => {
  // ✅ Track if image failed to load — never retry broken images
  const [imgFailed, setImgFailed] = useState(false);

  // Don't even try to load local /avatars/ paths — they don't exist on deployed servers
  const isLocalPath =
    !avatar ||
    avatar.startsWith("/avatars/") ||
    avatar.startsWith("avatars/") ||
    avatar === "default.png" ||
    avatar.includes("default");

  const shouldShowImage = avatar && !isLocalPath && !imgFailed;

  if (shouldShowImage) {
    return (
      <img
        src={avatar}
        alt={username || "user"}
        width={size}
        height={size}
        className={className}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        // ✅ onError sets imgFailed=true ONCE — no infinite loop
        onError={() => setImgFailed(true)}
      />
    );
  }

  // Fallback: colored letter avatar
  return <LetterAvatar username={username} size={size} />;
};

export default UserAvatar;
