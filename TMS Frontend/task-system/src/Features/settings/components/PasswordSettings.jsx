import { useState } from "react";
import { Input } from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

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
    // placeholder — later calls authApi.changePassword(form)
    setForm({ current: "", newPass: "", confirm: "" });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface rounded-card shadow-card p-6 flex flex-col gap-4 max-w-md"
    >
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
  );
}
