import { useEffect, useMemo, useRef, useState } from "react";
import { Search, User, ChevronDown, Check, LayoutGrid, List } from "lucide-react";
import { employeesApi } from "../api/employeesApi";

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Check-out specifically shows "00:00" instead of "—" while the employee
// hasn't checked out yet, per the new card requirement. Check-in keeps
// using formatTime's normal "—" fallback, unchanged.
function formatCheckOut(iso) {
  if (!iso) return "00:00";
  return formatTime(iso);
}

function Avatar({ name, gender, size = "sm" }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  const isFemale = (gender || "").toLowerCase() === "female";
  const dims = size === "lg" ? "w-16 h-16" : "w-9 h-9";
  const iconSize = size === "lg" ? 28 : 16;

  return (
    <div
      className={`${dims} rounded-full flex items-center justify-center shrink-0 border`}
      style={
        isFemale
          ? {
              background: "rgba(244,114,182,0.15)",
              borderColor: "rgba(244,114,182,0.3)",
            }
          : {
              background: "rgba(96,165,250,0.15)",
              borderColor: "rgba(96,165,250,0.3)",
            }
      }
    >
      <User size={iconSize} color={isFemale ? "#f472b6" : "#60a5fa"} />
      <span className="sr-only">{initial}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const isPresent = status === "present";
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        isPresent
          ? "bg-green-500/15 text-green-400"
          : "bg-white/10 text-white/40"
      }`}
    >
      {isPresent ? "Present" : "Absent"}
    </span>
  );
}

// Card used in Card View — reuses Avatar/StatusPill/formatTime so both
// view modes render the exact same underlying employee data.
function EmployeeCard({ emp }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col items-center text-center hover:border-orange-500/30 hover:bg-white/[0.07] transition-colors">
      <Avatar name={emp.name} gender={emp.gender} size="lg" />
      <p className="text-sm font-medium text-white mt-3 truncate w-full">
        {emp.name}
      </p>
      <p className="text-xs text-white/40 truncate w-full">
        {emp.department}
      </p>
      <div className="mt-3">
        <StatusPill status={emp.status} />
      </div>
      <div className="mt-4 pt-4 border-t border-white/10 w-full text-xs text-white/50">
        Emp # {emp.employeeCode}
      </div>
      <div className="mt-2 w-full flex items-center justify-between text-xs">
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-blue-400 font-medium">Check In</span>
          <span className="text-white/70">{formatTime(emp.checkIn)}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-red-400 font-medium">Check Out</span>
          <span className="text-white/70">{formatCheckOut(emp.checkOut)}</span>
        </div>
      </div>
    </div>
  );
}

// Custom-styled dropdown — a native <select>'s open menu can't be themed
// via Tailwind, so this builds the popup ourselves to match the dark UI.
function DepartmentDropdown({ departments, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label = value || "All Departments";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 min-w-[180px] px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white transition-colors ${
          isOpen
            ? "border-orange-500/40 ring-2 ring-orange-500/40"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          size={15}
          className={`text-white/40 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full min-w-[200px] rounded-xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden py-1">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
              value === ""
                ? "text-orange-400 bg-orange-500/10"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            All Departments
            {value === "" && <Check size={14} />}
          </button>

          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => {
                onChange(dept);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left truncate transition-colors ${
                value === dept
                  ? "text-orange-400 bg-orange-500/10"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="truncate">{dept}</span>
              {value === dept && <Check size={14} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [viewMode, setViewMode] = useState("present"); // "present" | "all" — present is default
  const [viewLayout, setViewLayout] = useState("card"); // "card" | "list" — card is default

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await employeesApi.getRoster();
        if (!cancelled) setEmployees(data.employees || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Couldn't load employees");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department || "—"));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !search ||
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(search.toLowerCase());
      const matchesDept =
        !departmentFilter || emp.department === departmentFilter;
      const matchesView = viewMode === "all" || emp.status === "present";
      return matchesSearch && matchesDept && matchesView;
    });
  }, [employees, search, departmentFilter, viewMode]);

  const presentCount = useMemo(
    () => employees.filter((e) => e.status === "present").length,
    [employees],
  );

  return (
    <div>
      <h2
        className="text-4xl font-semibold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Employees
      </h2>
      <p className="text-sm text-white/50 mt-1">
        Live attendance status, synced from the biometric device.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or employee number..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />
        </div>

        <DepartmentDropdown
          departments={departments}
          value={departmentFilter}
          onChange={setDepartmentFilter}
        />

        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 shrink-0">
          <button
            onClick={() => setViewMode("present")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "present"
                ? "bg-orange-500/20 text-orange-400"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Present ({presentCount})
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "all"
                ? "bg-orange-500/20 text-orange-400"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            All ({employees.length})
          </button>
        </div>

        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 shrink-0">
          <button
            onClick={() => setViewLayout("card")}
            className={`p-2 rounded-lg transition-colors ${
              viewLayout === "card"
                ? "bg-orange-500/20 text-orange-400"
                : "text-white/50 hover:text-white/80"
            }`}
            title="Card view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewLayout("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewLayout === "list"
                ? "bg-orange-500/20 text-orange-400"
                : "text-white/50 hover:text-white/80"
            }`}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <div
        className={
          viewLayout === "list"
            ? "mt-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
            : "mt-6"
        }
      >
        {isLoading && (
          <p className="text-sm text-white/50 px-6 py-8 text-center">
            Loading employees…
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 px-6 py-4">
            {error}
          </p>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <p className="text-sm text-white/50 px-6 py-8 text-center">
            No employees found.
          </p>
        )}

        {!isLoading &&
          !error &&
          filtered.length > 0 &&
          (viewLayout === "list" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Emp #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-400 uppercase tracking-wider">
                      Check Out
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((emp) => (
                    <tr
                      key={emp.employeeCode}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.name} gender={emp.gender} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {emp.name}
                            </p>
                            <p className="text-xs text-white/40 truncate">
                              {emp.department}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-white/70">
                        {emp.employeeCode}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <StatusPill status={emp.status} />
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-white/70">
                        {formatTime(emp.checkIn)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-white/70">
                        {formatCheckOut(emp.checkOut)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((emp) => (
                <EmployeeCard key={emp.employeeCode} emp={emp} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}