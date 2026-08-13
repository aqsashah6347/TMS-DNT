import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import {
  LogOut,
  Mail,
  Check,
  BadgeCheck,
  CalendarCheck2,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { usersApi } from "../../api/usersApi";
import { taskApi } from "../../api/taskApi";
import { AVATAR_COLORS } from "../../utils/avatarColors";
import { useNavigate } from "react-router-dom";

// Renders as an anchored corner dropdown (not a centered modal) — meant to
// be placed inside a `relative` wrapper right next to the profile button
// that toggles `isOpen`, e.g. <div className="relative"><button .../><ProfileMenu .../></div>.
export default function ProfileMenu({ isOpen, onClose }) {
  const { user, login, logout } = useAuthStore();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Today's Progress status — null while checking, then true/false once we
  // know whether any of this user's tasks got a progress log entry today.
  const [progressLoading, setProgressLoading] = useState(true);
  const [updatedToday, setUpdatedToday] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setProgressLoading(true);
    taskApi
      .getDailyProgress()
      .then((tasks) => {
        if (cancelled) return;
        setUpdatedToday((tasks || []).some((t) => t.updatedToday));
      })
      .catch((err) => {
        console.error("Couldn't load today's progress status:", err);
        if (!cancelled) setUpdatedToday(null);
      })
      .finally(() => {
        if (!cancelled) setProgressLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleLogout() {
    logout();
    onClose();
    navigate("/login");
  }

  function goToDailyProgress() {
    onClose();
    navigate("/daily-progress");
  }

  async function handlePickColor(color) {
    if (color === user?.avatarColor || saving) return;
    setSaving(true);
    try {
      await usersApi.updateAvatarColor(color);
      login({ ...user, avatarColor: color });
    } catch (err) {
      console.error("Couldn't save avatar color:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-dropdown-menu absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={user?.name}
            color={user?.avatarColor}
            size={44}
            className="text-lg"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5 truncate">
              <Mail size={12} className="shrink-0" /> {user?.email}
            </p>
            {user?.enrollNo && (
              <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                <BadgeCheck size={12} className="shrink-0" /> ID:{" "}
                {user.enrollNo}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={goToDailyProgress}
          disabled={progressLoading}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors disabled:opacity-60 ${
            updatedToday
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15"
              : "border-orange-500/25 bg-orange-500/10 text-orange-400 hover:bg-orange-500/15"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <CalendarCheck2 size={13} />
            Today's Progress
          </span>
          <span className="flex items-center gap-1">
            {progressLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : updatedToday ? (
              "Updated"
            ) : (
              "Not updated yet"
            )}
          </span>
        </button>

        <div>
          <p className="text-xs font-medium text-white/60 mb-2">
            Profile icon color
          </p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((color) => {
              const active = color === user?.avatarColor;
              return (
                <button
                  key={color}
                  type="button"
                  disabled={saving}
                  onClick={() => handlePickColor(color)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-[#1e2025] transition-transform hover:scale-110 disabled:opacity-50 ${
                    active ? "ring-white" : "ring-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {active && <Check size={11} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="danger"
          onClick={handleLogout}
          className="w-full justify-center"
        >
          <LogOut size={14} className="inline mr-1.5 -mt-0.5" /> Log Out
        </Button>
      </div>
    </div>
  );
}
