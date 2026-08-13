// src/Features/tasks/components/TaskAssigneePicker.jsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Check, X, Filter, Folder } from "lucide-react";

// "Assigned To" picker for the Task modal. Same search-bar +
// standalone Filters-icon pattern (Department + Branch) as
// TeamMemberPicker / TeamManagerPicker, single-select.
//
// The one thing this picker adds on top of that pattern: when the task
// has a project selected, the candidate list is scoped down to that
// project's own members (projectMemberIds) — the same list shown as
// "Team Assigned" on the Project modal. That project scoping is ANDed
// with the Department/Branch filters, not a replacement for them —
// pick a project AND a department/branch and both conditions apply at
// once, same as the search term does.
//
// Admins vs managers browse differently:
// - Admin (restrictToProject=false): sees everyone by default; picking
//   a project narrows the list down to that project's members.
// - Manager (restrictToProject=true): can't browse "everyone" at all —
//   a project has to be picked first, and only then can they choose an
//   assignee, scoped to that project's members. No project selected
//   yet -> the results list stays empty with a prompt to pick one,
//   instead of falling back to their whole team.
//
// `users` is the already-permission-scoped assignable list (built by
// TaskModal from usersApi.getAssignableUsers(), enriched with
// department/branch when the caller is admin). This component doesn't
// fetch anything itself — no need, TaskModal already has the data.
export default function TaskAssigneePicker({
  users,
  selectedId,
  onChange,
  showFilters = false,
  restrictToProject = false,
  projectId,
  projectName,
  projectMemberIds, // Set<string> | null — null/undefined means no project scoping
}) {
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

  // Department/Branch filters reset if the project changes underneath
  // them — a filter combo that made sense for one project's roster
  // might silently zero out results for another.
  useEffect(() => {
    setActiveDept("All");
    setActiveBranch("All");
  }, [projectId]);

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

  useLayoutEffect(() => {
    if (!isOpen) return;
    function position() {
      const rect = searchFieldRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 6;
      // The search field itself can be quite narrow (it shares its row
      // with the Filters button), but names + department/branch need
      // more room than that to read cleanly — so the panel always gets
      // at least 280px, growing from the field's left edge, then gets
      // pulled back in if that would run it off the right edge of the
      // viewport instead of letting it get clipped.
      const minWidth = 280;
      const width = Math.max(rect.width, minWidth);
      const maxLeft = window.innerWidth - width - 8;
      const left = Math.min(rect.left, Math.max(8, maxLeft));
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const desiredHeight = 340;
      const openUpward = spaceBelow < 240 && spaceAbove > spaceBelow;
      setPanelStyle({
        position: "fixed",
        left,
        width,
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
  }, [isOpen]);

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
    const set = new Set(users.map((u) => u.department || "Unassigned"));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const branches = useMemo(() => {
    const set = new Set(users.map((u) => u.branch || "Unassigned"));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const isProjectScoped = Boolean(projectId && projectMemberIds);
  // Managers (restrictToProject) have nothing to browse until a
  // project is picked — no "fall back to everyone" for them.
  const isBlockedOnProject = restrictToProject && !isProjectScoped;

  // Project scoping (if any) ANDs with the department/branch filters
  // and the search term — all conditions have to hold at once, not
  // just the most-recently-touched one.
  const filtered = useMemo(() => {
    if (isBlockedOnProject) return [];
    const term = search.trim().toLowerCase();
    return users
      .filter((u) => !isProjectScoped || projectMemberIds.has(String(u.id)))
      .filter((u) => activeDept === "All" || u.department === activeDept)
      .filter(
        (u) =>
          activeBranch === "All" || (u.branch || "Unassigned") === activeBranch,
      )
      .filter((u) => !term || u.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    users,
    search,
    activeDept,
    activeBranch,
    isProjectScoped,
    projectMemberIds,
    isBlockedOnProject,
  ]);

  const activeFilterCount =
    (activeDept !== "All" ? 1 : 0) + (activeBranch !== "All" ? 1 : 0);

  const selectedUser = useMemo(
    () =>
      selectedId
        ? users.find((u) => String(u.id) === String(selectedId))
        : null,
    [users, selectedId],
  );

  function select(user) {
    const alreadySelected = String(selectedId) === String(user.id);
    onChange(alreadySelected ? "" : String(user.id));
    setIsOpen(false);
    setSearch("");
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
          Assigned To
        </label>
        {showFilters && (
          <button
            type="button"
            ref={filterBtnRef}
            onClick={() => setIsFilterOpen((prev) => !prev)}
            title={
              activeFilterCount > 0
                ? `Filters (${activeFilterCount})`
                : "Filters"
            }
            className={`relative shrink-0 flex items-center justify-center w-5 h-5 rounded-md transition-colors ${
              isFilterOpen || activeFilterCount > 0
                ? "text-orange-300"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Filter size={13} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400" />
            )}
          </button>
        )}
      </div>

      <div className="relative" ref={searchFieldRef}>
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          disabled={isBlockedOnProject}
          placeholder={
            selectedUser
              ? selectedUser.name
              : isBlockedOnProject
                ? "Select a project first..."
                : "Search employees..."
          }
          className="glass-input !pl-8 !pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {selectedId && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Clear assignee"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isProjectScoped && (
        <p className="flex items-center gap-1.5 text-[11px] text-white/40 px-0.5">
          <Folder size={11} className="shrink-0" />
          Showing members of{" "}
          <span className="text-white/60">{projectName}</span>
          {activeFilterCount > 0 ? " — plus your filters below" : ""}
        </p>
      )}

      {isBlockedOnProject && (
        <p className="flex items-center gap-1.5 text-[11px] text-white/40 px-0.5">
          <Folder size={11} className="shrink-0" />
          Pick a project above to choose an assignee from its members.
        </p>
      )}

      {showFilters &&
        isFilterOpen &&
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

      {isOpen &&
        panelStyle &&
        createPortal(
          <div
            ref={resultsPanelRef}
            style={{ ...panelStyle, zIndex: "var(--z-index-popover)" }}
            className="flex flex-col gap-2 p-2.5 bg-[#1a1410] border border-white/10 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
              {/* Unassigned is always selectable, regardless of project
                  scoping or filters — clearing an assignee shouldn't
                  require clearing your filters first. */}
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`w-full min-w-0 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors border shrink-0 ${
                  !selectedId
                    ? "bg-orange-400/15 border-orange-400/40"
                    : "border-transparent hover:bg-white/5"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-semibold text-white/50 shrink-0">
                  —
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/70">Unassigned</p>
                </div>
                {!selectedId && (
                  <Check size={16} className="text-orange-300 shrink-0" />
                )}
              </button>

              <div className="border-t border-white/10 my-1" />

              {filtered.length === 0 && (
                <p className="text-xs text-white/40 text-center py-6 px-4">
                  {isBlockedOnProject
                    ? "Select a project to see its members here."
                    : isProjectScoped
                      ? "No members of this project match."
                      : "No employees match."}
                </p>
              )}

              {filtered.map((u) => {
                const isSelected = String(selectedId) === String(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => select(u)}
                    className={`w-full min-w-0 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors border shrink-0 ${
                      isSelected
                        ? "bg-orange-400/15 border-orange-400/40"
                        : "border-transparent hover:bg-white/5"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{u.name}</p>
                      {(u.department || u.branch) && (
                        <p className="text-[11px] text-white/40 truncate">
                          {u.department}
                          {u.branch ? ` · ${u.branch}` : ""}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-orange-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
