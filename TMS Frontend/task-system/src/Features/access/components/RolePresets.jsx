import { Dropdown } from "../../../components/ui/Dropdown";
import { useAccessStore } from "../accessStore";

const roleOptions = ["admin", "manager", "user"].map((v) => ({
  value: v,
  label: v,
}));

export default function RolePresets({ userId, currentRole }) {
  const setRolePreset = useAccessStore((s) => s.setRolePreset);

  return (
    <Dropdown
      value={currentRole}
      onChange={(role) => setRolePreset(userId, role)}
      options={roleOptions}
    />
  );
}
