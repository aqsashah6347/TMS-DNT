import { useState } from "react";
import { Check, ShieldCheck, UserPlus } from "lucide-react";
import { useAccessStore } from "../accessStore";
import { Dropdown } from "../../../components/ui/Dropdown";
import RolePresets from "./RolePresets";

const roleOptions = ["user", "manager", "admin"].map((v) => ({
  value: v,
  label: v,
}));

function AssignRoleForm({ employee }) {
  const assignRoleToRosterEmployee = useAccessStore(
    (s) => s.assignRoleToRosterEmployee,
  );
  const isAssigning = useAccessStore((s) => s.isAssigning);
  const error = useAccessStore((s) => s.error);
  const [role, setRole] = useState("user");

  return (
    <div className="glass glass-card h-full">
      <div className="glass-content flex flex-col items-center justify-center gap-3 py-14 text-center">
        <UserPlus size={28} className="text-white/20" />
        <div>
          <p className="text-sm text-white font-medium">{employee.name}</p>
          <p className="text-xs text-white/40 mt-1 max-w-xs">
            No TMS login yet. Pick a role and assign it — this creates their
            account right now, no backend editing required.
          </p>
        </div>

        <div className="w-40 mt-2">
          <Dropdown value={role} onChange={setRole} options={roleOptions} />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={() => assignRoleToRosterEmployee(employee, role)}
          disabled={isAssigning}
          className="glass-badge glass-badge--primary px-4 py-2 text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {isAssigning ? "Assigning…" : `Assign as ${role}`}
        </button>
      </div>
    </div>
  );
}

export default function AccessPanel() {
  const { permissions, modules, actions, selectedEmployee, toggleAction } =
    useAccessStore();

  if (!selectedEmployee) {
    return (
      <div className="glass glass-card h-full">
        <div className="glass-content flex flex-col items-center justify-center gap-2 py-16">
          <ShieldCheck size={28} className="text-white/20" />
          <p className="text-sm text-white/40">
            Select an employee to manage their access.
          </p>
        </div>
      </div>
    );
  }

  const perm = selectedEmployee.userId
    ? permissions.find((p) => p.userId === selectedEmployee.userId)
    : null;

  if (!perm) {
    return <AssignRoleForm employee={selectedEmployee} />;
  }

  return (
    <div className="glass glass-card h-full">
      <div className="glass-content flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-sm font-semibold text-white">
              {perm.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {perm.userName}
              </p>
              <p className="text-[11px] text-white/40">
                Employee #{perm.userId}
              </p>
            </div>
          </div>
          <div className="w-40">
            <RolePresets userId={perm.userId} currentRole={perm.role} />
          </div>
        </div>

        <table className="glass-table">
          <thead>
            <tr>
              <th>Module</th>
              {actions.map((a) => (
                <th
                  key={a}
                  style={{ textAlign: "center" }}
                  className="capitalize"
                >
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod}>
                <td className="text-white capitalize">{mod}</td>
                {actions.map((action) => {
                  const active = perm.overrides[mod]?.includes(action);
                  return (
                    <td key={action} style={{ textAlign: "center" }}>
                      <button
                        onClick={() => toggleAction(perm.userId, mod, action)}
                        className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition-colors ${
                          active
                            ? "bg-emerald-400 text-white shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                            : "bg-white/10 text-transparent"
                        }`}
                      >
                        <Check size={12} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-[11px] text-white/30">
          Toggling an action here overrides {perm.userName.split(" ")[0]}'s
          default {perm.role} permissions for that module only.
        </p>
      </div>
    </div>
  );
}
