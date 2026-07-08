import PermissionTable from "../features/access/components/PermissionTable";
import AuditLog from "../features/access/components/AuditLog";

export default function Access() {
  return (
    <div>
      <h2
        className="text-4xl font-semibold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Manage Access
      </h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <PermissionTable />
        </div>
        <AuditLog />
      </div>
    </div>
  );
}
