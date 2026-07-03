import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// Custom dropdown (not native <select>) so options can be styled with your palette.
// Closes on outside-click; no portal needed here since it's positioned relative
// to its own wrapper, not clipped by a parent modal's overflow.
export function Dropdown({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      {label && <label className="text-xs font-medium text-muted">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-bg rounded-card px-3 py-2 text-sm text-dark flex items-center justify-between gap-2"
      >
        <span className="capitalize">{selected?.label || "Select..."}</span>
        <ChevronDown size={14} className="text-muted" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 w-full bg-surface rounded-card shadow-card z-20 py-1 max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm capitalize text-dark hover:bg-bg"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}