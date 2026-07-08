import { User, CheckCircle2, AlertCircle, Mail, CheckCheck } from "lucide-react";

const iconMap = {
  assignment: { icon: User, color: "#c4c4c4", bg: "rgba(255,255,255,0.1)" },
  status: { icon: CheckCircle2, color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
  overdue: { icon: AlertCircle, color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  comment: { icon: Mail, color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
};

export default function NotificationItem({ notification, onMarkRead, style }) {
  const { icon: Icon, color, bg } = iconMap[notification.type] || iconMap.status;

  return (
    <div
      style={style}
      onClick={() => !notification.read && onMarkRead(notification.id)}
      className={`glass-row cascade-in ${
        !notification.read ? "cursor-pointer bg-white/[0.04]" : "opacity-70"
      }`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: bg }}
      >
        <Icon size={16} color={color} />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${
            notification.read ? "text-white/60" : "text-white/90"
          }`}
        >
          {notification.message}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-white/40">
          <span>{notification.time}</span>
          <span>&bull;</span>
          <span className="capitalize">{notification.relatedEntity}</span>
        </div>
      </div>

      {!notification.read ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
      ) : (
        <CheckCheck size={14} className="shrink-0 text-white/25" />
      )}
    </div>
  );
}
