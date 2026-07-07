import { Check } from "lucide-react";
import { useAccessStore } from "../accessStore";
import RolePresets from "./RolePresets";

export default function PermissionTable() {
  const { permissions, modules, actions, toggleAction } = useAccessStore();

  return (
    <div className="glass glass-table-wrap">
      <div className="glass-content">
        {permissions.map((perm) => (
          <div
            key={perm.userId}
            className="border-b border-white/10 last:border-0 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-xs font-semibold text-white">
                  {perm.userName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-white">
                  {perm.userName}
                </span>
              </div>
              <div className="w-36">
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
                            onClick={() =>
                              toggleAction(perm.userId, mod, action)
                            }
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
          </div>
        ))}
      </div>
    </div>
  );
}
