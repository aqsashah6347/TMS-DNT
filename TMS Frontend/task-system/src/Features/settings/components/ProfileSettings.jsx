import { useState } from "react";
import { Input } from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { useAuthStore } from "../../../store/useAuthStore";

export default function ProfileSettings() {
  const { user, login } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  function handleSave(e) {
    e.preventDefault();
    login({ ...user, ...form });
  }

  return (
    <Card className="max-w-md">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-white">Profile</h3>
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
    </Card>
  );
}
