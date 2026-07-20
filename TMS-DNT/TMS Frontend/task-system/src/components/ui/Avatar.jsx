import { DEFAULT_AVATAR_COLOR } from "../../utils/avatarColors";

// Shared initials avatar. Pass `color` (a hex string from a user's
// avatar_color, saved via ProfileMenu) to render that user's chosen color
// consistently everywhere they show up — header, team members, project
// members, etc. Falls back to the app's default orange if no color is set.
export default function Avatar({ name, color, size = 32, className = "" }) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const bg = color || DEFAULT_AVATAR_COLOR;

  return (
    <div
      title={name}
      className={`avatar-gradient shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.42)),
        background: `linear-gradient(135deg, ${bg} 0%, color-mix(in srgb, ${bg} 55%, black) 100%)`,
      }}
    >
      {initial}
    </div>
  );
}
