// import { useState } from "react";
// import { Input } from "../../components/ui/Input";
// import { useNavigate } from "react-router-dom";
// import { useAuthStore } from "../../store/useAuthStore";
// import { authApi } from "../../api/authApi";
// import TwoFactorForm from "./TwoFactorForm";

import { useState } from "react";
import { Input } from "../../components/ui/Input";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { authApi } from "../../api/authApi";
import TwoFactorForm from "./TwoFactorForm";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [step, setStep] = useState("credentials"); // "credentials" | "2fa"
  const [tempToken, setTempToken] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const data = await authApi.login(form.email, form.password);

      if (data.requiresTwoFactor) {
        setTempToken(data.tempToken);
        setStep("2fa");
        return;
      }

      // No 2FA — we already have the real user + token.
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  }

  if (step === "2fa") {
    return (
      <TwoFactorForm
        tempToken={tempToken}
        onBack={() => setStep("credentials")}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <Input
        type="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="Email"
        className="login-pill-input"
      />
    <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          className="login-pill-input"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray/500 hover:text-gray/700 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="login-signin-btn w-full rounded-full py-3 text-white font-semibold cursor-pointer border-none transition-all duration-300"
      >
        {isLoading ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}
