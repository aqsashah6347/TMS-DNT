import { useState } from "react";
import { Check, Archive, Bell, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Avatar from "../../../components/ui/Avatar";
import { useAuthStore } from "../../../store/useAuthStore";
import { usersApi } from "../../../api/usersApi";
import { AVATAR_COLORS } from "../../../utils/avatarColors";
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  requestNotificationPermission,
} from "../../../lib/notify";

export default function ProfileAppearanceSettings() {
  const { user, login } = useAuthStore();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [notifsOn, setNotifsOn] = useState(getNotificationsEnabled());

  async function handlePickColor(color) {
    if (color === user?.avatarColor || saving) return;
    setSaving(true);
    try {
      await usersApi.updateAvatarColor(color);
      // Update the locally-cached user immediately so the header and
      // everywhere else this color shows up reflects it right away,
      // without waiting on a refetch.
      login({ ...user, avatarColor: color });
    } catch (err) {
      console.error("Couldn't save avatar color:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleToggleNotifications() {
    const next = !notifsOn;
    setNotifsOn(next);
    setNotificationsEnabled(next);
    if (next) requestNotificationPermission();
  }

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto">
        <h3 className="text-sm font-semibold text-white mb-3">
          Profile icon color
        </h3>
        <div className="flex items-center gap-4 mb-4">
          <Avatar
            name={user?.name}
            color={user?.avatarColor}
            size={48}
            className="text-lg"
          />
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((color) => {
              const active = color === user?.avatarColor;
              return (
                <button
                  key={color}
                  type="button"
                  disabled={saving}
                  onClick={() => handlePickColor(color)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-[#1e2025] transition-transform hover:scale-110 disabled:opacity-50 ${
                    active ? "ring-white" : "ring-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {active && <Check size={13} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="w-full max-w-3xl mx-auto">
        <h3 className="text-sm font-semibold text-white mb-3">Notifications</h3>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              {notifsOn ? (
                <Bell size={16} className="text-white/70" />
              ) : (
                <BellOff size={16} className="text-white/40" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white">Message notifications</p>
              <p className="text-xs text-white/50 truncate">
                Desktop alerts and tab badge for new messages
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={notifsOn}
            onClick={handleToggleNotifications}
            className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
              notifsOn ? "bg-orange-500" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                notifsOn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </Card>

      <Card className="w-full max-w-3xl mx-auto">
        <h3 className="text-sm font-semibold text-white mb-3">
          Archived chats
        </h3>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Archive size={16} className="text-white/70" />
            </div>
            <p className="text-xs text-white/50">
              Chats you've archived stay out of your inbox until you open them
              here
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => navigate("/chat", { state: { filter: "archived" } })}
            className="shrink-0"
          >
            View archived
          </Button>
        </div>
      </Card>
    </>
  );
}
