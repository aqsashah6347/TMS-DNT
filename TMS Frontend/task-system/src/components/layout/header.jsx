import { useState, useRef, useEffect } from "react";
import { Search, Bell } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../features/inbox/notificationStore";
import ProfileMenu from "./ProfileMenu";
import Logo from "./Logo";
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
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = unreadCount();

  return (
    <>
      <header className="hash-bar fixed top-0 left-0 right-0 z-30 h-16 flex items-center px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Logo size={26} />

          <h1 className="text-lg font-semibold tracking-wide text-orange-400 whitespace-nowrap">
            Task Management System
          </h1>
        </div>

        {/* Right Side */}
        <div className="ml-auto flex items-center gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 w-72 rounded-full border border-white/10 bg-[#2a2d34] px-4 py-2 transition-all duration-300 hover:border-orange-500/60 focus-within:border-orange-500 focus-within:shadow-[0_0_18px_rgba(249,115,22,0.25)]">
            <Search size={16} className="text-orange-400" />

            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
            />
          </div>

          {/* Notifications */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            >
              <Bell size={17} className="text-white/70" />

              {count > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              )}
            </button>

            {bellOpen && (
              <div className="glass-dropdown-menu absolute right-0 top-full z-30 mt-2 max-h-96 w-80 overflow-y-auto rounded-3xl">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-semibold text-white">
                    Notifications
                  </p>
                </div>

                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-sm text-white/50">
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
                      className={`w-full border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10 ${
                        !n.read ? "bg-white/5" : ""
                      }`}
                    >
                      <p className="text-xs leading-snug text-white">
                        {n.message}
                      </p>

                      <p className="mt-1 text-[11px] text-white/40">{n.time}</p>
                    </button>
                  ))
                )}

                <button
                  onClick={() => {
                    setBellOpen(false);
                    navigate("/inbox");
                  }}
                  className="w-full py-2.5 text-center text-xs font-medium text-orange-300 transition-colors hover:bg-white/10"
                >
                  View all
                </button>
              </div>
            )}
          </div>

          {/* Profile */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-white/10"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-semibold text-white">
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
