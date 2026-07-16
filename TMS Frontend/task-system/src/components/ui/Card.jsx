import { forwardRef } from "react";

const Card = forwardRef(function Card(
  {
    children,
    className = "",
    hover = true,
    onClick,
    onMouseMove,
    onMouseLeave,
    style,
  },
  ref,
) {
  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={style}
      className={`glass glass-card w-full ${hover ? "glass-card-hover" : ""} ${className}`}
    >
      <div className="glass-content">{children}</div>
    </div>
  );
});

export default Card;
