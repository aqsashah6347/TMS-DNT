import LoginForm from "../features/auth/LoginForm";

export default function Login() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-[32px] p-10 w-full max-w-md flex flex-col items-center gap-7 relative z-10">
        <div className="glass-content flex flex-col items-center gap-7 w-full">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-[0_4px_24px_rgba(52,211,153,0.4)]">
              <span
                className="text-white font-bold text-2xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                T
              </span>
            </div>
            <div className="text-center">
              <h1
                className="text-2xl text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Welcome to TMS
              </h1>
              <p className="text-sm text-white/50 mt-1">
                Sign in to your account to continue
              </p>
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
