import { useMemo, useState } from "react";
import { Check, ShieldCheck, UserPlus, Save, Undo2 } from "lucide-react";
import { useAccessStore } from "../accessStore";
import { Dropdown } from "../../../components/ui/Dropdown";
import RolePresets from "./RolePresets";

const roleOptions = ["user", "manager", "admin"].map((v) => ({
  value: v,
  label: v,
}));

function capitalize(word) {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

// '"view"' / '"view" and "edit"' / '"view", "edit", and "assign"'
function formatActionList(list) {
  const quoted = list.map((a) => `"${a}"`);
  if (quoted.length <= 1) return quoted[0] || "";
  if (quoted.length === 2) return `${quoted[0]} and ${quoted[1]}`;
  return `${quoted.slice(0, -1).join(", ")}, and ${quoted[quoted.length - 1]}`;
}

// Mirrors the backend's phrasing so the live preview and the post-save
// summary read the same way, e.g. '"view" access has been revoked from Teams'.
function describeModuleChange(module, added, removed) {
  const label = capitalize(module);
  const sentences = [];
  if (added.length) {
    const verb = added.length > 1 ? "have" : "has";
    sentences.push(
      `${formatActionList(added)} access ${verb} been granted on ${label}`,
    );
  }
  if (removed.length) {
    const verb = removed.length > 1 ? "have" : "has";
    sentences.push(
      `${formatActionList(removed)} access ${verb} been revoked from ${label}`,
    );
  }
  return sentences.join("; ");
}

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
  const {
    permissions,
    modules,
    actions,
    selectedEmployee,
    draftOverrides,
    draftRole,
    isSaving,
    error,
    lastSaveSummary,
    stageToggleAction,
    stageRolePreset,
    saveChanges,
    discardChanges,
    clearSaveSummary,
  } = useAccessStore();

  const perm =
    selectedEmployee?.userId != null
      ? permissions.find((p) => p.userId === selectedEmployee.userId)
      : null;

  const effectiveOverrides = draftOverrides || perm?.overrides || {};
  const effectiveRole = draftRole || perm?.role;

  // Everything staged that differs from what's actually saved — this is
  // both what enables the Save button and what gets shown to the person
  // as a preview of what they're about to commit. Phrased the same way
  // the backend phrases the saved-change summary, so the preview and the
  // confirmation afterward read consistently.
  const pendingChanges = useMemo(() => {
    if (!perm) return [];
    const list = [];
    if (draftRole && draftRole !== perm.role) {
      list.push(
        `Role will be changed from ${capitalize(perm.role)} to ${capitalize(draftRole)}`,
      );
    }
    for (const mod of modules) {
      const before = [...(perm.overrides[mod] || [])].sort();
      const after = [...(effectiveOverrides[mod] || [])].sort();
      const added = after.filter((a) => !before.includes(a));
      const removed = before.filter((a) => !after.includes(a));
      const sentence = describeModuleChange(mod, added, removed);
      if (sentence) list.push(sentence);
    }
    return list;
  }, [perm, draftRole, effectiveOverrides, modules]);

  const hasChanges = pendingChanges.length > 0;

  if (!selectedEmployee) {
    return (
      <div className="glass glass-card h-full">
        <div className="glass-content flex flex-col items-center justify-center gap-2 py-16 px-8 text-center">
          {lastSaveSummary ? (
            <>
              <div className="w-11 h-11 rounded-full bg-emerald-400/15 flex items-center justify-center">
                <Check size={20} className="text-emerald-400" />
              </div>
              <p className="text-sm text-white font-medium mt-1">
                Saved changes for {lastSaveSummary.userName}
              </p>
              <ul className="text-xs text-white/50 space-y-1 mt-2">
                {lastSaveSummary.changes.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
              <button
                onClick={clearSaveSummary}
                className="text-xs text-white/40 hover:text-white mt-4 underline underline-offset-2"
              >
                Dismiss
              </button>
            </>
          ) : (
            <>
              <ShieldCheck size={28} className="text-white/20" />
              <p className="text-sm text-white/40">
                Select an employee to manage their access.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

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
            <RolePresets currentRole={effectiveRole} onChange={stageRolePreset} />
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
                  const active = effectiveOverrides[mod]?.includes(action);
                  return (
                    <td key={action} style={{ textAlign: "center" }}>
                      <button
                        onClick={() => stageToggleAction(mod, action)}
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

        {hasChanges && (
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2.5">
            <p className="text-xs font-medium text-orange-300 mb-1.5">
              Unsaved changes
            </p>
            <ul className="text-[11px] text-white/60 space-y-0.5">
              {pendingChanges.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          {hasChanges && (
            <button
              onClick={discardChanges}
              disabled={isSaving}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <Undo2 size={13} />
              Discard
            </button>
          )}
          <button
            onClick={saveChanges}
            disabled={!hasChanges || isSaving}
            className="glass-badge glass-badge--primary flex items-center gap-1.5 px-4 py-2 text-sm hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
