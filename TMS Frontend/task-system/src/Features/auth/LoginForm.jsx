import { useState } from "react";
import { Input } from "../../components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { authApi } from "../../api/authApi";
import TwoFactorForm from "./TwoFactorForm";
import { Eye, EyeOff, Mail } from "lucide-react";
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full items-center">
      {/* Employee ID Input */}
      <div className="relative w-full">
        <Input
          type="text"
          value={form.employeeId}
          onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          placeholder="Employee ID"
          autoComplete="off"
          className="login-underline-input text-white placeholder:text-white/80 placeholder:font-normal bg-transparent w-full"
        />
        <Mail
          size={18}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none"
        />
      </div>

      {/* Password Input */}
      <div className="relative w-full">
        <Input
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          autoComplete="new-password"
          className="login-underline-input text-white placeholder:text-white/80 placeholder:font-normal bg-transparent w-full"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      {/* ⚡ Specular Button (Light Orange BG + Specular Orange Line) ⚡ */}
      <div className="w-full flex justify-center mt-2">
        <SpecularButton
          type="submit"
          disabled={isLoading}
          size="md"
          radius={50}
          tint="#ffa766"                /* 👈 Light Orange Tint */
          tintOpacity={0.25}             /* Smooth soft orange background fill */
          blur={4}
          textColor="#ffffff"
          lineColor="#ff8e3f"            /* Moving highlight line orange hi hai */
          baseColor="#804419"            /* Soft dark orange base line */
          intensity={1.2}
          shineSize={12}
          shineFade={40}
          thickness={1.5}
          speed={0.35}
          followMouse={true}
          autoAnimate={true}
          className="w-[85%] max-w-[220px]"
        >
          {isLoading ? "Logging in..." : "Log In"}
        </SpecularButton>
      </div>
    </form>
  );
}