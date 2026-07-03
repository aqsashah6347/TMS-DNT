import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEffect } from "react";

// Uses a portal so the modal always renders at document.body,
// avoiding the overflow-clipping bugs you hit before with nested containers.
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-lg",
}) {
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-dark/40" onClick={onClose} />
      <div
        className={`relative bg-surface rounded-card shadow-card w-full ${width} mx-4 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-light">
          <h3 className="text-lg font-semibold text-dark">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-dark">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
