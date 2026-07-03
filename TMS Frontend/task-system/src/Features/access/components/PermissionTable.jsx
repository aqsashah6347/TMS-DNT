import { Check } from "lucide-react";
import { useAccessStore } from "../accessStore";
import RolePresets from "./RolePresets";
import Card from "../../../components/ui/Card";

export default function PermissionTable() {
  const { permissions, modules, actions, toggleAction } = useAccessStore();

  return (
    <Card className="overflow-x-auto">
      {permissions.map((perm) => (
        <div key={perm.userId} className="border-b border-bg last:border-0 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-xs font-semibold text-dark">
                {perm.userName.charAt(0)}
              </div>
              <span className="text-sm font-medium text-dark">
                {perm.userName}
              </span>
            </div>
            <div className="w-36">
              <RolePresets userId={perm.userId} currentRole={perm.role} />
            </div>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1 font-medium">Module</th>
                {actions.map((a) => (
                  <th
                    key={a}
                    className="py-1 font-medium text-center capitalize"
                  >
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod}>
                  <td className="py-1.5 text-dark capitalize">{mod}</td>
                  {actions.map((action) => {
                    const active = perm.overrides[mod]?.includes(action);
                    return (
                      <td key={action} className="py-1.5 text-center">
                        <button
                          onClick={() => toggleAction(perm.userId, mod, action)}
                          className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition-colors ${
                            active
                              ? "bg-primary text-dark"
                              : "bg-bg text-transparent"
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
    </Card>
  );
}
