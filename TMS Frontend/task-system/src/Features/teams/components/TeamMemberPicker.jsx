// src/Features/teams/components/TeamMemberPicker.jsx  (NEW FILE)
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Check, X } from "lucide-react";
import { employeesApi } from "../../../api/employeesApi";

// Employee picker for the New/Edit Team modal. Pulls from the same
// employeesApi.getRoster() the Employees page uses, then reuses that
// page's "search + department + branch" pattern (built here as compact
// filter chips instead of the Employees page's popover, per the Teams
// requirements doc) so picking members feels consistent with the rest
// of the app.
//
// The panel portals to document.body and positions itself with
// `position: fixed` off the search input's own bounding rect, instead
// of rendering as an `absolute` child inside the modal. The modal is
// `overflow-y: auto; max-height: 90vh`, so with department AND branch
// filter rows plus a scrollable employee list, the old inline version
// didn't reliably fit — it could get clipped or cramped depending on
// where the field sat in the form. Portaling gives it the full
// viewport to lay out in, and it now closes explicitly via a Done
// button (in addition to an outside click) instead of only ever
// closing on outside click.
//
// Only roster employees with an existing tms_users login (emp.userId)
// can actually be selected — a team member has to be a real account.
// Employees without one yet show up grayed out with a "no account" tag;
// give them a role on the Access page first.
export default function TeamMemberPicker({ selectedIds, onChange }) {
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState("All");
  const [activeBranch, setActiveBranch] = useState("All");
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);

  const fieldRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    employeesApi
      .getRoster()
      .then((data) => {
        if (!cancelled) setRoster(data.employees || []);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message || "Couldn't load employees");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the panel on any click outside both the field and the
  // (portaled, so no longer a DOM descendant of the field) panel.
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (
        fieldRef.current &&
        !fieldRef.current.contains(e.target) &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reposition against the field on open, and keep it glued there while
  // the modal scrolls or the window resizes.
  useLayoutEffect(() => {
    if (!isOpen) return;
    function position() {
      const rect = fieldRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const desiredHeight = 380;
      const openUpward = spaceBelow < 260 && spaceAbove > spaceBelow;
      setPanelStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(
          220,
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
  }, [isOpen]);

  const departments = useMemo(() => {
    const set = new Set(roster.map((e) => e.department || "—"));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [roster]);

  const branches = useMemo(() => {
    const set = new Set(roster.map((e) => e.branch || "Unassigned"));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [roster]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return roster
      .filter((e) => activeDept === "All" || e.department === activeDept)
      .filter(
        (e) =>
          activeBranch === "All" || (e.branch || "Unassigned") === activeBranch,
      )
      .filter((e) => !term || e.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roster, search, activeDept, activeBranch]);

  function toggle(emp) {
    if (!emp.userId) return; // no account yet — not selectable
    const next = selectedIds.includes(emp.userId)
      ? selectedIds.filter((id) => id !== emp.userId)
      : [...selectedIds, emp.userId];
    onChange(next);
  }

  function FilterRow({ items, active, onSelect }) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
              active === item
                ? "bg-orange-500/20 text-orange-300"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5" ref={fieldRef}>
      <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
        Members {selectedIds.length > 0 && `(${selectedIds.length} selected)`}
      </label>

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search employees..."
          className="glass-input !pl-8"
        />
      </div>

      {isOpen &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            style={{ ...panelStyle, zIndex: "var(--z-index-popover)" }}
            className="flex flex-col gap-2 p-2.5 bg-[#1a1410] border border-white/10 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] font-medium text-white/30 uppercase tracking-wide px-0.5">
                Department
              </span>
              <FilterRow
                items={departments}
                active={activeDept}
                onSelect={setActiveDept}
              />
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] font-medium text-white/30 uppercase tracking-wide px-0.5">
                Branch
              </span>
              <FilterRow
                items={branches}
                active={activeBranch}
                onSelect={setActiveBranch}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 shrink-0">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 border-t border-white/10 pt-2">
              {isLoading && (
                <p className="text-xs text-white/40 text-center py-6">
                  Loading employees…
                </p>
              )}

              {!isLoading && filtered.length === 0 && (
                <p className="text-xs text-white/40 text-center py-6">
                  No employees match.
                </p>
              )}

              {!isLoading &&
                filtered.map((emp) => {
                  const hasAccount = Boolean(emp.userId);
                  const isSelected =
                    hasAccount && selectedIds.includes(emp.userId);

                  return (
                    <button
                      key={emp.employeeCode}
                      type="button"
                      onClick={() => toggle(emp)}
                      disabled={!hasAccount}
                      title={
                        hasAccount
                          ? undefined
                          : "No TMS account yet — assign one on the Access page"
                      }
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors border shrink-0 ${
                        isSelected
                          ? "bg-orange-400/15 border-orange-400/40"
                          : "border-transparent hover:bg-white/5"
                      } ${!hasAccount ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">
                          {emp.name}
                        </p>
                        <p className="text-[11px] text-white/40 truncate">
                          {emp.department}
                          {emp.branch ? ` · ${emp.branch}` : ""}
                        </p>
                      </div>
                      {!hasAccount && (
                        <span className="glass-badge shrink-0 opacity-60">
                          no account
                        </span>
                      )}
                      {isSelected && (
                        <Check size={16} className="text-orange-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => onChange([])}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:hover:text-white/40 transition-colors"
              >
                <X size={12} /> Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-colors"
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
