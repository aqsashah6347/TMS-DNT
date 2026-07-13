import { useEffect, useMemo, useState } from "react";
import { Search, User } from "lucide-react";
import { employeesApi } from "../api/employeesApi";

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({ name, gender }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  const isFemale = (gender || "").toLowerCase() === "female";

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border"
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
      <User size={16} color={isFemale ? "#f472b6" : "#60a5fa"} />
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

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [viewMode, setViewMode] = useState("present"); // "present" | "all" — present is default

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

  // Department list derived from whatever's actually in the roster.
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

      {/* Search + department filter + present/all toggle */}
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

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

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
      </div>

      {/* Content */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
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

        {!isLoading && !error && filtered.length > 0 && (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
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
                      {formatTime(emp.checkOut)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
