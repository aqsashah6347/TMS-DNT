const variants = {
  primary: "glass-btn--primary",
  secondary: "glass-btn--ghost",
  ghost: "glass-btn--ghost",
  danger: "glass-btn--danger",
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
      className={`glass glass-btn ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
