import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { LogOut, Mail } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    onClose();
    navigate("/login");
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account" width="max-w-sm">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-dark font-semibold text-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-dark">{user?.name}</p>
            <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
              <Mail size={12} /> {user?.email}
            </p>
          </div>
        </div>

        <Button variant="danger" onClick={handleLogout} className="w-full">
          <LogOut size={14} className="inline mr-1.5 -mt-0.5" /> Log Out
        </Button>
      </div>
    </Modal>
  );
}
