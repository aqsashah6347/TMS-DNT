import { useState } from "react";
import { Input } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import TwoFactorForm from "./TwoFactorForm";

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [step, setStep] = useState("credentials"); // 'credentials' | '2fa'
  const [pendingUser, setPendingUser] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    // Placeholder — later calls authApi.login(form) and reads the real user + role back.
    setPendingUser({ id: 1, name: "Aqsa", email: form.email, role: "admin" });
    setStep("2fa");
  }

  if (step === "2fa") {
    return (
      <TwoFactorForm
        pendingUser={pendingUser}
        onBack={() => setStep("credentials")}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-sm"
    >
      <Input
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        type="password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="••••••••"
      />
      <Button
        variant="primary"
        type="submit"
        className="mt-2 justify-center w-full"
      >
        Continue
      </Button>
    </form>
  );
}
