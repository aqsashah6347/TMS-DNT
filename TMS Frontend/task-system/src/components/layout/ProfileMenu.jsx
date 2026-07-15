import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import { LogOut, Mail, Check } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { usersApi } from "../../api/usersApi";
import { AVATAR_COLORS } from "../../utils/avatarColors";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu({ isOpen, onClose }) {
  const { user, login, logout } = useAuthStore();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  function handleLogout() {
    logout();
    onClose();
    navigate("/login");
  }

  async function handlePickColor(color) {
    if (color === user?.avatarColor || saving) return;
    setSaving(true);
    try {
      await usersApi.updateAvatarColor(color);
      // Update the locally-cached user immediately so the header/this menu
      // reflect the new color right away, without waiting on a refetch.
      login({ ...user, avatarColor: color });
    } catch (err) {
      console.error("Couldn't save avatar color:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account" width="max-w-sm">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Avatar
            name={user?.name}
            color={user?.avatarColor}
            size={48}
            className="text-lg"
          />
          <div>
            <p className="text-sm font-semibold text-white">{user?.name}</p>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
              <Mail size={12} /> {user?.email}
            </p>
          </div>
        </div>

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

        <Button
          variant="danger"
          onClick={handleLogout}
          className="w-full justify-center"
        >
          <LogOut size={14} className="inline mr-1.5 -mt-0.5" /> Log Out
        </Button>
      </div>
    </Modal>
  );
}
