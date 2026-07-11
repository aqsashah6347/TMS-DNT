import { User, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../inbox/notificationStore";

const iconMap = {
  assignment: { icon: User, color: "#c4c4c4", bg: "rgba(255,255,255,0.1)" },
  status: { icon: CheckCircle2, color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
  overdue: { icon: AlertCircle, color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  comment: { icon: Mail, color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
};

export default function InboxPreview() {
  const { notifications, markAsRead } = useNotificationStore();
  const navigate = useNavigate();

  function handleClick(n) {
    markAsRead(n.id);
    navigate("/inbox");
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-white/40">You're all caught up 🎉</p>;
  }

  return (
    <div className="flex flex-col">
      {notifications.slice(0, 4).map((n) => {
        const { icon: Icon, color, bg } = iconMap[n.type] || iconMap.status;
        return (
          <button key={n.id} onClick={() => handleClick(n)} className="inbox-row">
            <span className="inbox-row__icon" style={{ background: bg }}>
              <Icon size={13} color={color} />
            </span>
            <span className="inbox-row__msg">{n.message}</span>
            <span className="inbox-row__time">{n.time}</span>
          </button>
        );
      })}
    </div>
  );
}
