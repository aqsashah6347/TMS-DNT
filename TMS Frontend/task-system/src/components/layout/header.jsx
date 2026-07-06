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
      <header className="glass fixed top-5 left-28 right-5 z-20 rounded-full px-3 py-2 flex items-center justify-between">
        <div className="glass-content flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 w-80">
          <Search size={16} className="text-white/40" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm text-white placeholder:text-white/40 w-full"
          />
        </div>

        <div className="glass-content flex items-center gap-3">
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Bell size={17} className="text-white/70" />
              {count > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
            </button>

            {bellOpen && (
              <div className="glass-dropdown-menu absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-3xl z-30">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-semibold text-white">
                    Notifications
                  </p>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-white/50 text-center py-6">
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
                      className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/10 transition-colors ${!n.read ? "bg-white/5" : ""}`}
                    >
                      <p className="text-xs text-white leading-snug">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-white/40 mt-1">{n.time}</p>
                    </button>
                  ))
                )}
                <button
                  onClick={() => {
                    setBellOpen(false);
                    navigate("/inbox");
                  }}
                  className="w-full text-center text-xs text-emerald-300 py-2.5 hover:bg-white/10 font-medium"
                >
                  View all
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 hover:bg-white/10 rounded-full pl-1 pr-3 py-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white font-semibold text-sm">
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
