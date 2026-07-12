import { useEffect } from "react";
import { useAccessStore } from "../Features/access/accessStore";
import PermissionTable from "../Features/access/components/PermissionTable";
import AuditLog from "../Features/access/components/AuditLog";

export default function Access() {
  const { fetchAll, isLoading, error, permissions } = useAccessStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div>
      <h2
        className="text-4xl font-semibold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Manage Access
      </h2>

      {error && (
        <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {isLoading && permissions.length === 0 ? (
        <div className="mt-6 text-sm text-white/50">Loading permissions…</div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="col-span-2">
            <PermissionTable />
          </div>
          <AuditLog />
        </div>
      )}
    </div>
  );
}