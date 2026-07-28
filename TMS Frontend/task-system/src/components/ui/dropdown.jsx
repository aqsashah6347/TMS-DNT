import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

// The menu panel portals to document.body and positions itself with
// `position: fixed`, computed fresh from the trigger button's own
// bounding rect every time it opens (and on scroll/resize while open).
// Before this it rendered as a plain `absolute` child inside whatever
// modal it lived in — since `.glass-modal` is `overflow-y: auto; max-height: 90vh`,
// a long option list could get visually clipped or squeezed instead of
// floating cleanly over the rest of the form. Portaling sidesteps that
// entirely: the menu is no longer inside the modal's scroll/clip box at
// all, so it always has the full viewport to lay out in. It also flips
// to open upward when there isn't enough room below the trigger.
export function Dropdown({
  label,
  value,
  onChange,
  options,
  searchable = false,
  tabs = null, // e.g. [{ key: "all", label: "All" }, { key: "5", label: "Design Team" }]
  placeholder = "Select...",
  renderOption, // optional custom render: (opt) => node
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.key ?? "all");
  const [menuStyle, setMenuStyle] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recompute the fixed position every time the menu opens, and keep it
  // glued to the trigger while scrolling/resizing (e.g. scrolling the
  // modal body itself) instead of drifting away from the button.
  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 4;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const desiredHeight = 288; // matches previous max-h-72
      const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow;
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(
          160,
          Math.min(desiredHeight, openUpward ? spaceAbove : spaceBelow),
        ),
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + gap }
          : { top: rect.bottom + gap }),
      });
    }
    position();
    window.addEventListener("scroll", position, true);
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("scroll", position, true);
      window.removeEventListener("resize", position);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      const t = setTimeout(() => searchRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open, searchable]);

  const selected = options.find((o) => o.value === value);

  const filteredOptions = useMemo(() => {
    let result = options;
    if (tabs && activeTab !== "all") {
      // options tagged group:"all" (like "Unassigned") stay visible on every tab
      result = result.filter(
        (o) => String(o.group ?? "") === String(activeTab) || o.group === "all",
      );
    }
    if (searchable && query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((o) => o.label.toLowerCase().includes(q));
    }
    return result;
  }, [options, tabs, activeTab, searchable, query]);

  return (
    <div className="flex flex-col gap-1.5 relative">
      {label && (
        <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
          {label}
        </label>
      )}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="glass-input flex items-center justify-between gap-2"
      >
        <span className="capitalize truncate">
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={14} className="text-white/40 shrink-0" />
      </button>

      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            style={{ ...menuStyle, zIndex: "var(--z-index-popover)" }}
            className="glass-dropdown-menu py-1 flex flex-col overflow-hidden"
          >
            {searchable && (
              <div className="px-2 pb-1.5 pt-1 border-b border-white/10 shrink-0">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-white/5 border border-white/10 rounded-md pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-primary/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {tabs && (
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/10 overflow-x-auto shrink-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`shrink-0 text-[11px] px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                      activeTab === tab.key
                        ? "bg-primary/20 text-primary"
                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-y-auto py-1 flex-1">
              {filteredOptions.length === 0 && (
                <p className="text-xs text-white/30 text-center py-3">
                  No matches
                </p>
              )}
              {filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="glass-dropdown-item capitalize"
                >
                  {renderOption ? renderOption(opt) : opt.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
