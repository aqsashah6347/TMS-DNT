import { useMemo, useState } from "react";
import { History, Search, X } from "lucide-react";
import { useAccessStore } from "../accessStore";

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AuditLog() {
  const auditLog = useAccessStore((s) => s.auditLog);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return auditLog.filter((entry) => {
      if (
        term &&
        !entry.actor.toLowerCase().includes(term) &&
        !entry.action.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (entry.createdAt) {
        const entryDate = new Date(entry.createdAt);
        if (from && entryDate < from) return false;
        if (to && entryDate > to) return false;
      }
      return true;
    });
  }, [auditLog, search, dateFrom, dateTo]);

  const hasFilters = search || dateFrom || dateTo;

  return (
    <div className="glass glass-card">
      <div className="glass-content">
        <div className="flex items-center gap-2 mb-3">
          <History size={16} className="text-white/50" />
          <h4 className="text-sm font-semibold text-white">Audit Log</h4>
        </div>

        <div className="flex flex-col gap-2 mb-3">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="glass-input !pl-8 !pr-8 !text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="glass-input !text-xs !py-1.5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="glass-input !text-xs !py-1.5"
              />
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
              }}
              className="self-start text-[11px] text-white/40 hover:text-white underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-6">
              {auditLog.length === 0
                ? "No activity yet."
                : "No entries match your search or date range."}
            </p>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                className="text-xs border-b border-white/10 last:border-0 pb-2"
              >
                <p className="text-white">{entry.action}</p>
                <p className="text-white/40 mt-0.5">
                  {entry.actor} · {formatDateTime(entry.createdAt) || entry.time}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
