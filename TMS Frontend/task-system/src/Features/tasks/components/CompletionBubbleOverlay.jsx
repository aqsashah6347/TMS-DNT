import { useEffect, useRef, useState } from "react";
import { useUIStore } from "../../../store/useUIStore";

// Where the bubble flies to. Set this id on whatever button should act as
// the "catch" target (currently the "Completed Log" button in Tasks.jsx).
const TARGET_ID = "completed-log-btn";
const FLIGHT_MS = 650;
const ARC_LIFT = 90; // px the bubble rises above the straight line mid-flight
const BUMP_MS = 550;

export default function CompletionBubbleOverlay() {
  const completionBubble = useUIStore((s) => s.completionBubble);
  // Same StrictMode-safe pattern as ConfettiOverlay: compare the id, not a
  // one-shot boolean, so a re-run of this effect for the same value is a
  // no-op but a genuinely new trigger (even with identical x/y/color)
  // always plays.
  const lastHandledId = useRef(null);
  const [bubble, setBubble] = useState(null); // { x, y, scale, opacity, color }

  useEffect(() => {
    if (!completionBubble || completionBubble.id === lastHandledId.current) {
      return;
    }
    lastHandledId.current = completionBubble.id;

    const targetEl = document.getElementById(TARGET_ID);
    const rect = targetEl?.getBoundingClientRect();
    const startX = completionBubble.x;
    const startY = completionBubble.y;
    // Fallback target (top-right corner) in case the button isn't mounted
    // for some reason, so the bubble still has somewhere to fly rather
    // than throwing.
    const endX = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const endY = rect ? rect.top + rect.height / 2 : 24;
    const color = completionBubble.color || "#fb923c";

    let rafId;
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / FLIGHT_MS);
      const eased = t * t * (3 - 2 * t); // smoothstep
      const x = startX + (endX - startX) * eased;
      // Sine arc peaks mid-flight regardless of which direction the
      // target sits in, so it reads as a lofted "toss" either way.
      const arc = Math.sin(t * Math.PI) * ARC_LIFT;
      const y = startY + (endY - startY) * eased - arc;
      const scale = 1 - 0.65 * eased;
      const opacity = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;

      setBubble({ x, y, scale, opacity, color });

      if (t < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        setBubble(null);
        if (targetEl) {
          targetEl.style.setProperty("--clog-bump-color", color);
          targetEl.classList.add("clog-btn-bump");
          setTimeout(() => targetEl.classList.remove("clog-btn-bump"), BUMP_MS);
        }
      }
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [completionBubble]);

  if (!bubble) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, ${bubble.color}, ${bubble.color}cc)`,
        boxShadow: `0 0 12px 2px ${bubble.color}99, 0 0 2px ${bubble.color}`,
        pointerEvents: "none",
        zIndex: 9990,
        transform: `translate(${bubble.x - 8}px, ${bubble.y - 8}px) scale(${bubble.scale})`,
        opacity: bubble.opacity,
      }}
    />
  );
}
