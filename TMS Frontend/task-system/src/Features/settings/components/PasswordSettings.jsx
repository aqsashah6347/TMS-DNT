import { useState } from "react";
import { Input } from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

export default function PasswordSettings() {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (form.newPass !== form.confirm) {
      setError("New passwords don't match");
      return;
    }
    setError("");
    setForm({ current: "", newPass: "", confirm: "" });
  }

  return (
    <Card className="p-6 max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h3 className="font-semibold text-dark">Change Password</h3>
        <Input
          label="Current password"
          type="password"
          value={form.current}
          onChange={(e) => setForm({ ...form, current: e.target.value })}
        />
        <Input
          label="New password"
          type="password"
          value={form.newPass}
          onChange={(e) => setForm({ ...form, newPass: e.target.value })}
        />
        <Input
          label="Confirm new password"
          type="password"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        />
        {error && <p className="text-xs text-danger-text">{error}</p>}
        <Button variant="primary" type="submit" className="self-start">
          Update Password
        </Button>
      </form>
    </Card>
  );
}
