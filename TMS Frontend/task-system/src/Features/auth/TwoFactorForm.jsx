import { useState, useRef } from "react";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

export default function TwoFactorForm({ pendingUser, onBack }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const inputsRef = useRef([]);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  function handleChange(i, value) {
    if (!/^\d?$/.test(value)) return; // digits only
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

  function handleSubmit(e) {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length !== 6) {
      setError("Enter all 6 digits");
      return;
    }
    // Placeholder — later calls authApi.verifyOtp({ userId: pendingUser.id, otp })
    login(pendingUser);
    navigate("/");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-sm"
    >
      <p className="text-sm text-muted -mt-2">
        Enter the 6-digit code sent to your device
      </p>

      <div className="flex gap-2 justify-between">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            maxLength={1}
            className="w-11 h-12 text-center text-lg font-semibold bg-bg rounded-card outline-none focus:ring-2 focus:ring-primary text-dark"
          />
        ))}
      </div>

      {error && <p className="text-xs text-danger-text">{error}</p>}

      <Button variant="primary" type="submit">
        Verify
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-muted hover:text-dark self-center"
      >
        ← Back to login
      </button>
    </form>
  );
}
