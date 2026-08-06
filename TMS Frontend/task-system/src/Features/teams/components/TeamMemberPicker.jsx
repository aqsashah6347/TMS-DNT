// src/Features/teams/components/TeamMemberPicker.jsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Check, X, Filter } from "lucide-react";
import { employeesApi } from "../../../api/employeesApi";

// Employee picker for the New/Edit Team modal. Pulls from the same
// employeesApi.getRoster() the Employees page uses.
//
// Layout: a search input sits next to a standalone "Filters" icon
// button (Department + Branch), matching the Employees page's
// FiltersMenu pattern instead of always-visible chip rows. Both the
// search-results panel and the filters popover portal to document.body
// and position themselves with `position: fixed` off their own
// trigger's bounding rect, since the modal is `overflow-y: auto;
// max-height: 90vh` and an `absolute` child can get clipped depending
// on where the field sits in the form.
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
  const searchFieldRef = useRef(null);
  const resultsPanelRef = useRef(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPanelStyle, setFilterPanelStyle] = useState(null);
  const filterBtnRef = useRef(null);
  const filterPanelRef = useRef(null);

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

  // Close the results panel on any click outside both the search field
  // and the (portaled) panel.
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (
        searchFieldRef.current &&
        !searchFieldRef.current.contains(e.target) &&
        resultsPanelRef.current &&
        !resultsPanelRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close the filters popover on any click outside its button/panel.
  useEffect(() => {
    if (!isFilterOpen) return;
    function handleClickOutside(e) {
      if (
        filterBtnRef.current &&
        !filterBtnRef.current.contains(e.target) &&
        filterPanelRef.current &&
        !filterPanelRef.current.contains(e.target)
      ) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  // Reposition the results panel against the search field on open, and
  // keep it glued there while the modal scrolls or the window resizes.
  useLayoutEffect(() => {
    if (!isOpen) return;
    function position() {
      const rect = searchFieldRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const desiredHeight = 340;
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

  // Same positioning approach for the filters popover, anchored to the
  // filter button instead of the search field, right-aligned to it.
  useLayoutEffect(() => {
    if (!isFilterOpen) return;
    function position() {
      const rect = filterBtnRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 6;
      const panelWidth = 288;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const desiredHeight = 360;
      const openUpward = spaceBelow < 240 && spaceAbove > spaceBelow;
      setFilterPanelStyle({
        position: "fixed",
        right: Math.max(8, window.innerWidth - rect.right),
        width: panelWidth,
        maxHeight: Math.max(
          200,
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
  }, [isFilterOpen]);

  const departments = useMemo(() => {
    const set = new Set(roster.map((e) => e.department || "—"));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [roster]);

  const branches = useMemo(() => {
    const set = new Set(roster.map((e) => e.branch || "Unassigned"));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
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

  const activeFilterCount =
    (activeDept !== "All" ? 1 : 0) + (activeBranch !== "All" ? 1 : 0);

  function toggle(emp) {
    if (!emp.userId) return; // no account yet — not selectable
    const next = selectedIds.includes(emp.userId)
      ? selectedIds.filter((id) => id !== emp.userId)
      : [...selectedIds, emp.userId];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
        Members {selectedIds.length > 0 && `(${selectedIds.length} selected)`}
      </label>

      <div className="flex items-center gap-2">
        <div className="relative flex-1" ref={searchFieldRef}>
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

        <button
          type="button"
          ref={filterBtnRef}
          onClick={() => setIsFilterOpen((prev) => !prev)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 border text-xs font-medium text-white transition-colors ${
            isFilterOpen || activeFilterCount > 0
              ? "border-orange-500/40 text-orange-300"
              : "border-white/10 text-white/60 hover:border-white/20"
          }`}
        >
          <Filter size={14} />
          {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters"}
        </button>
      </div>

      {/* Filters popover — Department + Branch, portaled so it always
          has room inside the scrollable modal. */}
      {isFilterOpen &&
        filterPanelStyle &&
        createPortal(
          <div
            ref={filterPanelRef}
            style={{ ...filterPanelStyle, zIndex: "var(--z-index-popover)" }}
            className="flex flex-col p-3 gap-4 bg-[#1a1410] border border-white/10 rounded-xl shadow-2xl overflow-y-auto"
          >
            <div>
              <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 px-0.5">
                Department
              </p>
              <div className="max-h-32 overflow-y-auto space-y-0.5 pr-1">
                <button
                  type="button"
                  onClick={() => setActiveDept("All")}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors ${
                    activeDept === "All"
                      ? "text-orange-400 bg-orange-500/10"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  All Departments
                  {activeDept === "All" && <Check size={14} />}
                </button>
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setActiveDept(dept)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-left truncate transition-colors ${
                      activeDept === dept
                        ? "text-orange-400 bg-orange-500/10"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{dept}</span>
                    {activeDept === dept && (
                      <Check size={14} className="shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 px-0.5">
                Branch
              </p>
              <div className="max-h-32 overflow-y-auto space-y-0.5 pr-1">
                <button
                  type="button"
                  onClick={() => setActiveBranch("All")}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors ${
                    activeBranch === "All"
                      ? "text-orange-400 bg-orange-500/10"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  All Branches
                  {activeBranch === "All" && <Check size={14} />}
                </button>
                {branches.map((branch) => (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => setActiveBranch(branch)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-left truncate transition-colors ${
                      activeBranch === branch
                        ? "text-orange-400 bg-orange-500/10"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{branch}</span>
                    {activeBranch === branch && (
                      <Check size={14} className="shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveDept("All");
                  setActiveBranch("All");
                }}
                className="w-full text-center text-xs font-medium text-orange-400 hover:text-orange-300 pt-2 border-t border-white/10"
              >
                Clear filters
              </button>
            )}
          </div>,
          document.body,
        )}

      {/* Search results panel */}
      {isOpen &&
        panelStyle &&
        createPortal(
          <div
            ref={resultsPanelRef}
            style={{ ...panelStyle, zIndex: "var(--z-index-popover)" }}
            className="flex flex-col gap-2 p-2.5 bg-[#1a1410] border border-white/10 rounded-xl shadow-xl overflow-hidden"
          >
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 shrink-0">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
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
