import { Dropdown } from "../../../components/ui/Dropdown";

const roleOptions = ["admin", "manager", "user"].map((v) => ({
  value: v,
  label: v,
}));

export default function RolePresets({ currentRole, onChange }) {
  return (
    <Dropdown value={currentRole} onChange={onChange} options={roleOptions} />
  );
}
