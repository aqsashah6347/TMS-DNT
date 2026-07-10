import { useEffect, useState } from "react";
import LoginForm from "../features/auth/LoginForm";
import Logo from "../components/layout/Logo";

export default function Login() {
  const [fact, setFact] = useState("");

  useEffect(() => {
    fetch("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en")
      .then((res) => res.json())
      .then((data) => setFact(data.text))
      .catch(() => setFact("Honey never spoils."));
  }, []);
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="login-ring">
        <i />
        <i />
        <i />

        <div className="absolute w-72 flex flex-col items-center gap-6 z-10">
          <div className="flex flex-col items-center gap-2">
            <Logo size={40} />
            <h2
              className="text-2xl text-white"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              TMS Login
            </h2>
          </div>

          <LoginForm />
        </div>
      </div>
      <div className="absolute bottom-6 left-6 w-80">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-orange-400 text-lg">💡</span>
          <h3 className="text-sm font-semibold tracking-wide text-orange-400">
            Did You Know?
          </h3>
        </div>

        <p className="text-sm leading-6 text-white/70">{fact}</p>
      </div>
    </div>
  );
}
