import { useState, useRef, useEffect } from "react";
import { Search, Bell } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../features/inbox/notificationStore";
import ProfileMenu from "./ProfileMenu";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { user } = useAuthStore();
  const { notifications, unreadCount, markAsRead } = useNotificationStore();
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (bellRef.current && !bellRef.current.contains(e.target))
        setBellOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = unreadCount();

  return (
    <>
      <header className="h-16 bg-muted flex items-center justify-between px-6 border-b border-white/10">
        <div className="flex items-center gap-2 bg-white/10 rounded-card px-4 py-2 w-80 focus-within:ring-2 focus-within:ring-primary-light/50 transition-shadow">
          <Search size={16} className="text-white/50" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm text-white placeholder:text-white/50 w-full"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Bell size={18} className="text-white/80" />
              {count > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-card shadow-card z-30 max-h-96 overflow-y-auto">
                <div className="px-4 py-3 border-b border-bg">
                  <p className="text-sm font-semibold text-dark">
                    Notifications
                  </p>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">
                    No notifications
                  </p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        setBellOpen(false);
                        navigate("/inbox");
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-bg last:border-0 hover:bg-bg transition-colors ${
                        !n.read ? "bg-bg/50" : ""
                      }`}
                    >
                      <p className="text-xs text-dark leading-snug">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-muted mt-1">{n.time}</p>
                    </button>
                  ))
                )}
                <button
                  onClick={() => {
                    setBellOpen(false);
                    navigate("/inbox");
                  }}
                  className="w-full text-center text-xs text-primary py-2.5 hover:bg-bg font-medium"
                >
                  View all
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 hover:bg-white/10 rounded-card px-2 py-1.5 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-dark font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <span className="text-sm font-medium text-white">
              {user?.name || "Guest"}
            </span>
          </button>
        </div>
      </header>

      <ProfileMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
