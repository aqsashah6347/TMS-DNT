import { useState } from "react";
import { Input } from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { useAuthStore } from "../../../store/useAuthStore";

export default function ProfileSettings() {
  const { user, login } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  function handleSave(e) {
    e.preventDefault();
    login({ ...user, ...form }); // placeholder — later this calls authApi.updateProfile()
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-surface rounded-card shadow-card p-6 flex flex-col gap-4 max-w-md"
    >
      <h3 className="font-semibold text-dark">Profile</h3>
      <Input
        label="Full name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Button variant="primary" type="submit" className="self-start">
        Save Changes
      </Button>
    </form>
  );
}
