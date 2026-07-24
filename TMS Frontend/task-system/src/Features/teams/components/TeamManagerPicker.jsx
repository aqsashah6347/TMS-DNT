// src/Features/teams/components/TeamManagerPicker.jsx  (NEW FILE)
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, X } from "lucide-react";
import { employeesApi } from "../../../api/employeesApi";

// Manager picker for the New/Edit Team modal. Same search + department
// tabs pattern as TeamMemberPicker, but single-select, and the results
// render as a dropdown panel that only opens on focus/click instead of
// always being expanded — closes again on selection or on an outside
// click, so it behaves like a real search-dropdown rather than an
// always-open list.
//
// Only roster employees with an existing tms_users login (emp.userId)
// can be picked as manager — same "no account" rule as members.
export default function TeamManagerPicker({ selectedId, onChange }) {
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState("All");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

  // Close the dropdown on any click outside the component.
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

  const selectedEmp = useMemo(
    () =>
      selectedId
        ? roster.find((e) => String(e.userId) === String(selectedId))
        : null,
    [roster, selectedId],
  );

  function select(emp) {
    if (!emp.userId) return; // no account yet — not selectable
    const alreadySelected = String(selectedId) === String(emp.userId);
    onChange(alreadySelected ? "" : String(emp.userId));
    setIsOpen(false);
    setSearch("");
  }

  return (
    <div className="flex flex-col gap-2.5" ref={containerRef}>
      <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
        Manager{selectedEmp && `: ${selectedEmp.name}`}
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
          className="glass-input !pl-8 !pr-8"
        />
        {selectedId && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Clear manager"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
          >
            <X size={14} />
          </button>
        )}

        {/* Dropdown panel — only rendered while open, floats over the
            rest of the form instead of pushing it down. */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-20 flex flex-col gap-2 p-2 bg-[#1a1410] border border-white/10 rounded-xl shadow-xl">
            {/* Department tabs — same organizing pattern as TeamMemberPicker. */}
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

            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
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
                    hasAccount && String(selectedId) === String(emp.userId);

                  return (
                    <button
                      key={emp.employeeCode}
                      type="button"
                      onClick={() => select(emp)}
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
                        <p className="text-sm text-white truncate">
                          {emp.name}
                        </p>
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
        )}
      </div>
    </div>
  );
}