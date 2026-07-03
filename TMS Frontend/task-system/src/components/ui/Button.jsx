const variants = {
  primary: "bg-primary text-dark hover:bg-primary/80",
  secondary: "bg-primary-light text-dark hover:bg-primary-light/70",
  ghost: "bg-transparent text-muted hover:bg-bg",
  danger: "bg-danger text-danger-text hover:bg-danger/80",
};

export default function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-card text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
