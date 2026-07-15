// src/Features/teams/components/TeamMemberPicker.jsx  (NEW FILE)
import { useEffect, useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { employeesApi } from "../../../api/employeesApi";

// Employee picker for the New/Edit Team modal. Pulls from the same
// employeesApi.getRoster() the Employees page uses, then reuses that
// page's "search + department" pattern (built here as tabs instead of a
// dropdown, per the Teams requirements doc) so picking members feels
// consistent with the rest of the app.
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

  const departments = useMemo(() => {
    const set = new Set(roster.map((e) => e.department || "—"));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [roster]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return roster
      .filter((e) => activeDept === "All" || e.department === activeDept)
      .filter((e) => !term || e.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roster, search, activeDept]);

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

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="glass-input !pl-8"
        />
      </div>

      {/* Department tabs — same organizing pattern as the Employees page's
          department filter, just rendered as tabs instead of a dropdown. */}
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 overflow-x-auto">
        {departments.map((dept) => (
          <button
            key={dept}
            type="button"
            onClick={() => setActiveDept(dept)}
            className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeDept === dept
                ? "bg-orange-500/20 text-orange-300"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto border border-white/10 rounded-xl p-1.5">
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
            const isSelected = hasAccount && selectedIds.includes(emp.userId);

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
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors border ${
                  isSelected
                    ? "bg-orange-400/15 border-orange-400/40"
                    : "border-transparent hover:bg-white/5"
                } ${!hasAccount ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{emp.name}</p>
                  <p className="text-[11px] text-white/40 truncate">
                    {emp.department}
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
    </div>
  );
}
