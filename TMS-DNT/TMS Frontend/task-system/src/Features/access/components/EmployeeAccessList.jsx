import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { employeesApi } from "../../../api/employeesApi";
import { useAccessStore } from "../accessStore";

const ROLE_RANK = { admin: 0, manager: 1, user: 2 };
const ROLE_BADGE = {
  admin: "glass-badge--danger",
  manager: "glass-badge--amber",
  user: "glass-badge--violet",
};

export default function EmployeeAccessList() {
  const selectedEmployee = useAccessStore((s) => s.selectedEmployee);
  const selectEmployee = useAccessStore((s) => s.selectEmployee);

  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  // "present" is the default view — most of the time you're granting
  // access to someone who's actually in today, not scrolling the full
  // company roster.
  const [filterMode, setFilterMode] = useState("present");

  useEffect(() => {
    employeesApi
      .getRoster()
      .then((data) => {
        setRoster(data.employees || []);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Couldn't load employees");
        setIsLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return roster
      .filter((e) => filterMode === "all" || e.status === "present")
      .filter((e) => !term || e.name.toLowerCase().includes(term))
      .sort((a, b) => {
        const rankDiff = (ROLE_RANK[a.role] ?? 3) - (ROLE_RANK[b.role] ?? 3);
        if (rankDiff !== 0) return rankDiff;
        return a.name.localeCompare(b.name);
      });
  }, [roster, search, filterMode]);

  const elevated = filtered.filter(
    (e) => e.role === "admin" || e.role === "manager",
  );
  const regular = filtered.filter(
    (e) => e.role !== "admin" && e.role !== "manager",
  );

  function renderRow(emp) {
    const isSelected = selectedEmployee?.employeeCode === emp.employeeCode;

    return (
      <button
        key={emp.employeeCode}
        onClick={() =>
          selectEmployee({
            userId: emp.userId,
            employeeCode: emp.employeeCode,
            name: emp.name,
            role: emp.role,
          })
        }
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left border ${
          isSelected
            ? "bg-emerald-400/15 border-emerald-400/40"
            : "border-transparent hover:bg-white/5"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            emp.status === "present" ? "bg-emerald-400" : "bg-white/20"
          }`}
          title={emp.status === "present" ? "Present today" : "Absent today"}
        />
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
          {emp.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-white truncate flex-1">{emp.name}</span>
        {emp.role ? (
          <span
            className={`glass-badge ${ROLE_BADGE[emp.role] || ""} shrink-0`}
          >
            {emp.role}
          </span>
        ) : (
          <span className="glass-badge shrink-0 opacity-60">no account</span>
        )}
      </button>
    );
  }

  return (
    <div className="glass glass-card h-full">
      <div className="glass-content flex flex-col gap-3 h-full">
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

        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setFilterMode("present")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              filterMode === "present"
                ? "bg-emerald-400/20 text-emerald-300"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Present Today
          </button>
          <button
            onClick={() => setFilterMode("all")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              filterMode === "all"
                ? "bg-emerald-400/20 text-emerald-300"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            All Employees
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="text-xs text-white/40 text-center py-6">
            Loading employees…
          </p>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[560px]">
            {elevated.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide px-2">
                  Admins &amp; Managers
                </p>
                {elevated.map(renderRow)}
              </div>
            )}

            {regular.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide px-2">
                  Team Members
                </p>
                {regular.map(renderRow)}
              </div>
            )}

            {filtered.length === 0 && (
              <p className="text-xs text-white/40 text-center py-6">
                {filterMode === "present"
                  ? "No one is checked in right now."
                  : "No employees match."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
