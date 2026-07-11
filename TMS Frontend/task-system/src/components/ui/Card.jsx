export default function Card({
  children,
  className = "",
  hover = true,
  onClick,
  style,
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`glass glass-card w-full ${hover ? "glass-card-hover" : ""} ${className}`}
    >
      <div className="glass-content">{children}</div>
    </div>
  );
}
