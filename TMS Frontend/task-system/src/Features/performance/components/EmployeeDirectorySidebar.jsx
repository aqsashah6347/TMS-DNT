// src/Features/performance/components/EmployeeDirectorySidebar.jsx
import { Search, X, ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { initials } from "../utils";
import { ratingFor } from "../scoring";

export default function EmployeeDirectorySidebar({
  employees,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  departments,
  departmentFilter,
  onDepartmentChange,
}) {
  const [deptOpen, setDeptOpen] = useState(false);
  const deptRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (deptRef.current && !deptRef.current.contains(e.target))
        setDeptOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full lg:w-72 shrink-0 flex flex-col lg:h-[calc(100vh-14rem)]">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#2a2d34] px-4 py-2.5 mb-3 transition-all duration-300 hover:border-orange-500/60 focus-within:border-orange-500 focus-within:shadow-[0_0_18px_rgba(249,115,22,0.25)]">
        <Search size={15} className="text-orange-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search employee..."
          className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="text-white/40 hover:text-white shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Department filter */}
      <div ref={deptRef} className="relative mb-3">
        <button
          type="button"
          onClick={() => setDeptOpen((p) => !p)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white transition-colors ${
            deptOpen
              ? "border-orange-500/40 ring-2 ring-orange-500/40"
              : "border-white/10 hover:border-white/20"
          }`}
        >
          <span className="truncate">
            {departmentFilter || "All Departments"}
          </span>
          <ChevronDown
            size={15}
            className={`text-white/40 shrink-0 transition-transform ${deptOpen ? "rotate-180" : ""}`}
          />
        </button>
        {deptOpen && (
          <div className="absolute z-30 mt-2 w-full rounded-xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden p-1.5 max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onDepartmentChange("");
                setDeptOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-left ${
                departmentFilter === ""
                  ? "text-orange-400 bg-orange-500/10"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              All Departments
              {departmentFilter === "" && <Check size={14} />}
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => {
                  onDepartmentChange(dept);
                  setDeptOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-left truncate ${
                  departmentFilter === dept
                    ? "text-orange-400 bg-orange-500/10"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                <span className="truncate">{dept}</span>
                {departmentFilter === dept && (
                  <Check size={14} className="shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/10 border-t border-white/10 pr-1">
        {employees.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">
            No employees match.
          </p>
        ) : (
          employees.map((emp) => {
            const isSelected = emp.id === selectedId;
            const rating = ratingFor(emp.scores.final);
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => onSelect(emp.id)}
                className={`w-full flex items-center gap-3 py-3 px-2 text-left transition-colors ${
                  isSelected
                    ? "bg-orange-500/10 border-l-2 border-orange-400"
                    : "border-l-2 border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border text-xs font-semibold"
                  style={{
                    background: `${emp.avatarColor || "#fb923c"}22`,
                    borderColor: `${emp.avatarColor || "#fb923c"}55`,
                    color: emp.avatarColor || "#fb923c",
                  }}
                >
                  {initials(emp.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-white/85"}`}
                  >
                    {emp.name}
                  </p>
                  <p className="text-[11px] text-white/40 truncate">
                    {emp.department}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold shrink-0 ${isSelected ? "text-orange-400" : "text-white/50"}`}
                >
                  {emp.scores.final ?? "—"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
