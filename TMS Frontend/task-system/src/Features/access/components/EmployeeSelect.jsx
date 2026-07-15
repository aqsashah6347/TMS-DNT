import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useAccessStore } from "../accessStore";
import { employeesApi } from "../../../api/employeesApi";

export default function EmployeeSelect() {
  const permissions = useAccessStore((s) => s.permissions);
  const selectedUserId = useAccessStore((s) => s.selectedUserId);
  const setSelectedUserId = useAccessStore((s) => s.setSelectedUserId);

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [notFoundName, setNotFoundName] = useState(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    async function loadEmployees() {
      setLoadingEmployees(true);
      setFetchError(null);
      try {
        const data = await employeesApi.getDirectory();
        setEmployees(data.employees || []);
      } catch (err) {
        setFetchError(
          err.response?.data?.message || "Couldn't load employee list",
        );
      } finally {
        setLoadingEmployees(false);
      }
    }
    loadEmployees();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedPerm = permissions.find((p) => p.userId === selectedUserId);
  const selectedLabel = selectedPerm?.userName || notFoundName;

  const filtered = useMemo(
    () =>
      employees.filter((e) =>
        e.fullName.toLowerCase().includes(query.toLowerCase()),
      ),
    [employees, query],
  );

  function handleSelect(fullName) {
    const match = permissions.find(
      (p) => p.userName.trim().toLowerCase() === fullName.trim().toLowerCase(),
    );
    setOpen(false);
    setQuery("");
    if (match) {
      setNotFoundName(null);
      setSelectedUserId(match.userId);
    } else {
      setSelectedUserId(null);
      setNotFoundName(fullName);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 relative w-64" ref={ref}>
      <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
        Employee
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="glass-input flex items-center justify-between gap-2"
      >
        <span>{selectedLabel || "Select employee..."}</span>
        <ChevronDown size={14} className="text-white/40" />
      </button>

      {open && (
        <div className="glass-dropdown-menu absolute top-full mt-1 w-full z-20 py-1">
          <div className="flex items-center gap-2 px-3 pb-2 border-b border-white/10">
            <Search size={13} className="text-white/40" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees..."
              className="bg-transparent text-sm text-white placeholder:text-white/30 outline-none w-full"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loadingEmployees ? (
              <p className="text-xs text-white/40 px-3 py-2">Loading…</p>
            ) : fetchError ? (
              <p className="text-xs text-red-400 px-3 py-2">{fetchError}</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-white/40 px-3 py-2">No matches</p>
            ) : (
              filtered.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => handleSelect(e.fullName)}
                  className="glass-dropdown-item"
                >
                  {e.fullName}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {notFoundName && !selectedPerm && (
        <p className="text-xs text-red-400 mt-1">
          No app account found for "{notFoundName}" — permissions can't be
          shown.
        </p>
      )}
    </div>
  );
}