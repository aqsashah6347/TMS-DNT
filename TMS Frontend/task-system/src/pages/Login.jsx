import LoginForm from "../features/auth/LoginForm";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="bg-surface rounded-card shadow-card p-8 flex flex-col items-center gap-6">
        <div>
          <h1 className="text-xl font-bold text-dark text-center">TMS</h1>
          <p className="text-sm text-muted text-center mt-1">
            Sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
