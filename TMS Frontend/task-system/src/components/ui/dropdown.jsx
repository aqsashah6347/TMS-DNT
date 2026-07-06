import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

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
      {label && (
        <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="glass-input flex items-center justify-between gap-2"
      >
        <span className="capitalize">{selected?.label || "Select..."}</span>
        <ChevronDown size={14} className="text-white/40" />
      </button>

      {open && (
        <div className="glass-dropdown-menu absolute top-full mt-1 w-full z-20 py-1 max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="glass-dropdown-item capitalize"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
