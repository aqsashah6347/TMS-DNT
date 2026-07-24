// src/Features/projects/components/ProjectMemberPicker.jsx  (NEW FILE)
<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check } from "lucide-react";

// Member picker for the New/Edit Project modal. Same search-dropdown
// pattern as TeamMemberPicker/TeamManagerPicker (opens on focus, closes
// on outside click, stays open across picks since this is multi-select)
// but pulls straight from the `users` list already loaded by
// ProjectModal instead of a comma-separated name field — selecting
// "Aqsa" and "Owais" now means picking them from the list instead of
// typing their names and hoping the spelling matches.
export default function ProjectMemberPicker({ users, selectedIds, onChange }) {
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("All");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const roles = useMemo(() => {
    const set = new Set(users.map((u) => u.role || "—"));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [users]);
=======
import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";

// Member picker for the New/Edit Project modal. Pulls its list from
// usersApi.getAssignableUsers() (passed in as `users`) — the same
// role-aware endpoint TaskModal already uses for "Assigned To" — so a
// manager only ever sees their own team's members here, and an admin
// sees everyone. Includes an "All Members" shortcut to select/deselect
// every visible person in one click.
export default function ProjectMemberPicker({ users, selectedIds, onChange }) {
  const [search, setSearch] = useState("");
>>>>>>> 24a1ae82bd5cd1a515ff75279bc95d0f61e285d8

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
<<<<<<< HEAD
      .filter((u) => activeRole === "All" || u.role === activeRole)
      .filter((u) => !term || u.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, search, activeRole]);

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedIds.includes(u.id)),
    [users, selectedIds],
  );

  function toggle(user) {
    const next = selectedIds.includes(user.id)
      ? selectedIds.filter((id) => id !== user.id)
      : [...selectedIds, user.id];
    onChange(next);
    setSearch("");
  }

  return (
    <div className="flex flex-col gap-2.5" ref={containerRef}>
      <label className="text-xs font-medium text-muted mb-1.5 block">
        Members{" "}
        {selectedIds.length > 0 && (
          <span className="font-normal">({selectedIds.length} selected)</span>
        )}
      </label>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedUsers.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 bg-bg rounded-full pl-2.5 pr-1.5 py-1 text-xs text-dark"
            >
              {u.name}
              <button
                type="button"
                onClick={() => toggle(u)}
                className="text-muted hover:text-dark leading-none px-1"
                title={`Remove ${u.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

=======
      .filter((u) => !term || u.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, search]);

  const allVisibleIds = useMemo(() => filtered.map((u) => u.id), [filtered]);
  const allVisibleSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.includes(id));

  function toggle(userId) {
    const next = selectedIds.includes(userId)
      ? selectedIds.filter((id) => id !== userId)
      : [...selectedIds, userId];
    onChange(next);
  }

  // Selects/deselects every currently-visible (i.e. search-matched) user
  // in one go, without touching selections outside the current filter.
  function toggleAllVisible() {
    if (allVisibleSelected) {
      onChange(selectedIds.filter((id) => !allVisibleIds.includes(id)));
    } else {
      onChange(Array.from(new Set([...selectedIds, ...allVisibleIds])));
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
        Members {selectedIds.length > 0 && `(${selectedIds.length} selected)`}
      </label>

>>>>>>> 24a1ae82bd5cd1a515ff75279bc95d0f61e285d8
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
<<<<<<< HEAD
          onFocus={() => setIsOpen(true)}
          placeholder="Search people... e.g. Aqsa, Owais"
          className="glass-input !pl-8"
        />

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-20 flex flex-col gap-2 p-2 bg-[#1a1410] border border-white/10 rounded-xl shadow-xl">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 overflow-x-auto">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeRole === role
                      ? "bg-orange-500/20 text-orange-300"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="text-xs text-white/40 text-center py-6">
                  No people match.
                </p>
              )}

              {filtered.map((u) => {
                const isSelected = selectedIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors border ${
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
                      <p className="text-[11px] text-white/40 truncate">
                        {u.role}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-orange-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
=======
          placeholder="Search members..."
          className="glass-input !pl-8"
        />
      </div>

      <button
        type="button"
        onClick={toggleAllVisible}
        disabled={allVisibleIds.length === 0}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors border ${
          allVisibleSelected
            ? "bg-orange-400/15 border-orange-400/40"
            : "border-white/10 hover:bg-white/5"
        } ${allVisibleIds.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <div
          className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
            allVisibleSelected
              ? "bg-orange-400 border-orange-400"
              : "border-white/30"
          }`}
        >
          {allVisibleSelected && <Check size={12} className="text-white" />}
        </div>
        <span className="text-sm text-white flex-1">
          All Members{search.trim() && " (matching search)"}
        </span>
        <span className="text-[11px] text-white/40 shrink-0">
          {allVisibleIds.length}
        </span>
      </button>

      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto border border-white/10 rounded-xl p-1.5">
        {filtered.length === 0 && (
          <p className="text-xs text-white/40 text-center py-6">
            No members match.
          </p>
        )}

        {filtered.map((u) => {
          const isSelected = selectedIds.includes(u.id);

          return (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors border ${
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
                {u.teamName && (
                  <p className="text-[11px] text-white/40 truncate">
                    {u.teamName}
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
    </div>
  );
}
>>>>>>> 24a1ae82bd5cd1a515ff75279bc95d0f61e285d8
