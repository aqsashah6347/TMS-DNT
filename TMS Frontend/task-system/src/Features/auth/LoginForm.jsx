import { useState } from "react";
import { Input } from "../../components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { authApi } from "../../api/authApi";
import TwoFactorForm from "./TwoFactorForm";
import { Mail, Eye, EyeOff } from "lucide-react";
import SpecularButton from "../../components/ui/SpecularButton";

export default function LoginForm() {
  const [form, setForm] = useState({ employeeId: "", password: "" });
  const [step, setStep] = useState("credentials");
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
      const data = await authApi.login(form.employeeId, form.password);

      if (data.requiresTwoFactor) {
        setTempToken(data.tempToken);
        setStep("2fa");
        return;
      }

      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid Employee ID or password"
      );
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-[280px]">
      
      {/* Email / Employee ID Field */}
      <div className="relative w-full border-b border-white/20 focus-within:border-orange-400 transition-colors pb-1.5 flex items-center">
        <Input
          type="text"
          value={form.employeeId}
          onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          placeholder="Email"
          autoComplete="off"
          className="!bg-transparent text-white placeholder:text-white/40 w-full !border-none !outline-none !ring-0 focus:!ring-0 focus-visible:!ring-0 !shadow-none p-0 h-7 text-sm font-medium pr-8 [&:-webkit-autofill]:[transition-delay:9999s]"
        />
        <Mail
          size={18}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-orange-400 shrink-0 pointer-events-none z-10"
        />
      </div>

      {/* Password Field */}
      <div className="relative w-full border-b border-white/20 focus-within:border-orange-400 transition-colors pb-1.5 flex items-center">
        <Input
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          autoComplete="new-password"
          className="!bg-transparent text-white placeholder:text-white/40 w-full !border-none !outline-none !ring-0 focus:!ring-0 focus-visible:!ring-0 !shadow-none p-0 h-7 text-sm font-medium pr-8 [&:-webkit-autofill]:[transition-delay:9999s]"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-300 transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0 z-10"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="text-xs text-red-400 font-medium text-left">{error}</p>}

      {/* Specular Submit Button */}
      <div className="w-full mt-2">
        <SpecularButton
          type="submit"
          disabled={isLoading}
          radius={24}
          tint="#e57d25"
          lineColor="#ff9d42"
          baseColor="#d96a21"
          textColor="#ffffff"
          intensity={1.2}
          shineSize={15}
          shineFade={35}
          className="w-full !py-2.5 shadow-[0_4px_20px_rgba(217,106,33,0.35)]"
        >
          {isLoading ? "Logging in..." : "Log In"}
        </SpecularButton>
      </div>

    </form>
  );
}