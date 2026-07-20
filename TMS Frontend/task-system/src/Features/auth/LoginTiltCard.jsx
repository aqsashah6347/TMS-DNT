import { useState, useCallback } from "react";

const MAX_ROTATE = 8;
const HOVER_SCALE = 1.015;
const HOVER_LIFT = 10;

export default function LoginTiltCard({ children, className = "" }) {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [cardTransform, setCardTransform] = useState(
    "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)"
  );
  const [glowPos, setGlowPos] = useState({ x: "50%", y: "50%" });

  const handleMouseMove = useCallback(
    (e) => {
      if (isInputFocused) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const percentX = (x - rect.width / 2) / (rect.width / 2);
      const percentY = (y - rect.height / 2) / (rect.height / 2);

      const rotateX = -percentY * MAX_ROTATE;
      const rotateY = percentX * MAX_ROTATE;

      setCardTransform(
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-${HOVER_LIFT}px) scale(${HOVER_SCALE})`
      );
      setGlowPos({ x: `${(x / rect.width) * 100}%`, y: `${(y / rect.height) * 100}%` });
    },
    [isInputFocused]
  );

  const handleMouseLeave = useCallback(() => {
    setCardTransform(
      "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)"
    );
  }, []);

  // Bubbles up from any input/button inside the card (React uses focusin/focusout under the hood)
  const handleFocus = useCallback(() => {
    setIsInputFocused(true);
    setCardTransform(
      "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)"
    );
  }, []);

  const handleBlur = useCallback(() => {
    setIsInputFocused(false);
  }, []);

  return (
    <div className="login-tilt-perspective">
      <div
        className={`login-tilt-card ${className}`}
        style={{
          transform: isInputFocused
            ? "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)"
            : cardTransform,
          "--mouse-x": glowPos.x,
          "--mouse-y": glowPos.y,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <span className="login-tilt-glow" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}