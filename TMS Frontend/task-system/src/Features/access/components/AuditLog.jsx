import { History } from "lucide-react";
import { useAccessStore } from "../accessStore";

export default function AuditLog() {
  const auditLog = useAccessStore((s) => s.auditLog);

  return (
    <div className="glass glass-card">
      <div className="glass-content">
        <div className="flex items-center gap-2 mb-3">
          <History size={16} className="text-white/50" />
          <h4 className="text-sm font-semibold text-white">Audit Log</h4>
        </div>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {auditLog.map((entry) => (
            <div
              key={entry.id}
              className="text-xs border-b border-white/10 last:border-0 pb-2"
            >
              <p className="text-white">{entry.action}</p>
              <p className="text-white/40 mt-0.5">
                {entry.actor} · {entry.time}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
