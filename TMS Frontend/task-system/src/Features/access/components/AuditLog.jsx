import { History } from "lucide-react";
import { useAccessStore } from "../accessStore";
import Card from "../../../components/ui/Card";

export default function AuditLog() {
  const auditLog = useAccessStore((s) => s.auditLog);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <History size={16} className="text-muted" />
        <h4 className="text-sm font-semibold text-dark">Audit Log</h4>
      </div>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {auditLog.map((entry) => (
          <div
            key={entry.id}
            className="text-xs border-b border-bg last:border-0 pb-2"
          >
            <p className="text-dark">{entry.action}</p>
            <p className="text-muted mt-0.5">
              {entry.actor} · {entry.time}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
