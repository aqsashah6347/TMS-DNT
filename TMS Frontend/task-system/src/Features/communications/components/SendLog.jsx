// TMS Frontend/task-system/src/Features/communications/components/SendLog.jsx
import { useEffect } from "react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useCommunicationsStore, TYPE_LABELS } from "../communicationsStore";

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }) {
  const map = {
    sent: "glass-badge--primary",
    skipped: "glass-badge--amber",
    failed: "glass-badge--danger",
  };
  return (
    <span className={`glass-badge ${map[status] || "glass-badge--violet"}`}>
      <span className="glass-badge__dot" />
      {status}
    </span>
  );
}

export default function SendLog() {
  const logs = useCommunicationsStore((s) => s.logs);
  const logTotal = useCommunicationsStore((s) => s.logTotal);
  const logPage = useCommunicationsStore((s) => s.logPage);
  const logPageSize = useCommunicationsStore((s) => s.logPageSize);
  const logFilters = useCommunicationsStore((s) => s.logFilters);
  const setLogFilters = useCommunicationsStore((s) => s.setLogFilters);
  const fetchLog = useCommunicationsStore((s) => s.fetchLog);
  const isLoadingLog = useCommunicationsStore((s) => s.isLoadingLog);

  useEffect(() => {
    fetchLog(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logFilters.channel, logFilters.type, logFilters.status]);

  const totalPages = Math.max(1, Math.ceil(logTotal / logPageSize));

  return (
    <div className="glass glass-card mt-4">
      <div className="glass-content">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="glass-select"
              value={logFilters.channel}
              onChange={(e) => setLogFilters({ channel: e.target.value })}
            >
              <option value="">All channels</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>

            <select
              className="glass-select"
              value={logFilters.type}
              onChange={(e) => setLogFilters({ type: e.target.value })}
            >
              <option value="">All types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              className="glass-select"
              value={logFilters.status}
              onChange={(e) => setLogFilters({ status: e.target.value })}
            >
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="skipped">Skipped</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <button
            onClick={() => fetchLog(logPage)}
            className="glass glass-btn glass-btn--ghost glass-btn--sm flex items-center gap-1.5"
          >
            <RefreshCw
              size={14}
              className={isLoadingLog ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs border-b border-white/10">
                <th className="pb-2 pr-3 font-medium">When</th>
                <th className="pb-2 pr-3 font-medium">Recipient</th>
                <th className="pb-2 pr-3 font-medium">Channel</th>
                <th className="pb-2 pr-3 font-medium">Type</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 font-medium">Sent to</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => (
                <tr key={entry.id} className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white/70 whitespace-nowrap">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="py-2 pr-3 text-white">
                    {entry.userName || "—"}
                  </td>
                  <td className="py-2 pr-3 text-white/60 capitalize">
                    {entry.channel}
                  </td>
                  <td className="py-2 pr-3 text-white/60">
                    {TYPE_LABELS[entry.type] || entry.type}
                  </td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="py-2 pr-3 text-white/50 max-w-xs truncate">
                    {entry.recipient || "—"}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && !isLoadingLog && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-white/40">
                    No notifications logged yet for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-white/40">
            {logTotal} total · page {logPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={logPage <= 1}
              onClick={() => fetchLog(logPage - 1)}
              className="glass glass-btn glass-btn--ghost glass-btn--sm disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={logPage >= totalPages}
              onClick={() => fetchLog(logPage + 1)}
              className="glass glass-btn glass-btn--ghost glass-btn--sm disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
