// src/Features/projects/components/ProjectMemberPicker.jsx  (NEW FILE)
import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";

// Member picker for the New/Edit Project modal. Pulls its list from
// usersApi.getAssignableUsers() (passed in as `users`) — the same
// role-aware endpoint TaskModal already uses for "Assigned To" — so a
// manager only ever sees their own team's members here, and an admin
// sees everyone.
export default function ProjectMemberPicker({ users, selectedIds, onChange }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
      .filter((u) => !term || u.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, search]);

  function toggle(userId) {
    const next = selectedIds.includes(userId)
      ? selectedIds.filter((id) => id !== userId)
      : [...selectedIds, userId];
    onChange(next);
    setSearch("");
  }

  return (
    <div className="flex flex-col gap-2.5">
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
          placeholder="Search members..."
          className="glass-input !pl-8"
        />
      </div>

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