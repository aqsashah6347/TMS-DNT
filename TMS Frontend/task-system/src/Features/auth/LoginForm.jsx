import { useState } from "react";
import { Input } from "../../components/ui/Input";

  import { useNavigate } from "react-router-dom";
  import { useAuthStore } from "../../store/useAuthStore";
//import TwoFactorForm from "./TwoFactorForm";

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  // const [step, setStep] = useState("credentials");
  // const [pendingUser, setPendingUser] = useState(null);


  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  function handleSubmit(e) {
    e.preventDefault();

    login({
      id: 1,
      name: "Aqsa",
      email: form.email,
      role: "admin",
    });

    navigate("/");
  }

  // if (step === "2fa") {
  //   return (
  //     <TwoFactorForm
  //       pendingUser={pendingUser}
  //       onBack={() => setStep("credentials")}
  //     />
  //   );
  // }

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
      <Input
        type="password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="Password"
        className="login-pill-input"
      />
      <button
        type="submit"
        className="login-signin-btn w-full rounded-full py-3 text-white font-semibold cursor-pointer border-none transition-all duration-300"
      >
        Log In
      </button>

      {/* <div className="flex items-center justify-between px-1 text-sm">
        <a
          href="#"
          className="text-white/60 hover:text-white transition-colors"
        >
          Forgot Password
        </a>
        <a
          href="#"
          className="text-white/60 hover:text-white transition-colors"
        >
          Sign Up
        </a>
      </div> */}
    </form>
  );
}
