import LoginForm from "../features/auth/LoginForm";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center animated-gradient-bg p-4">
      <div className="bg-surface/95 backdrop-blur-md rounded-card shadow-2xl p-12 w-full max-w-md flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-dark font-bold text-2xl">T</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-dark">Welcome to TMS</h1>
            <p className="text-sm text-muted mt-1">
              Sign in to your account to continue
            </p>
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
