import { useState, useRef } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";

export default function TwoFactorForm({ tempToken, onBack }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef([]);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  function handleChange(i, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[i] = value;
    setCode(next);
    if (value && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length !== 6) {
      setError("Enter all 6 digits");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const data = await authApi.verifyOtp(tempToken, otp);
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect or expired code");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <p className="text-sm text-white/50 -mt-2 text-center">
        Enter the 6-digit code sent to your device
      </p>

      <div className="flex gap-2 justify-center">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            maxLength={1}
            className="w-11 h-12 text-center text-lg font-semibold rounded-2xl outline-none text-white"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "2px solid rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="login-signin-btn w-full rounded-full py-3 text-white font-semibold cursor-pointer border-none transition-all duration-300"
      >
        {isLoading ? "Verifying..." : "Verify"}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-white/50 hover:text-white self-center"
      >
        ← Back to login
      </button>
    </form>
  );
}
