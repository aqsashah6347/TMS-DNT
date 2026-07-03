export default function Card({
  children,
  className = "",
  hover = false,
  onClick,
  style,
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-surface rounded-card border border-primary-light/40 shadow-[0_1px_3px_rgba(0,16,33,0.04),0_8px_24px_-4px_rgba(0,16,33,0.08)] ${
        hover
          ? "hover:shadow-[0_1px_3px_rgba(0,16,33,0.06),0_12px_32px_-4px_rgba(0,16,33,0.14)] hover:-translate-y-0.5 transition-all duration-200"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
