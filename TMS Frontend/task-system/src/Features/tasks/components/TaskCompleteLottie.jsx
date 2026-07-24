import { useEffect, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useUIStore } from "../../../store/useUIStore";

// Served from public/lottieTick.json (Vite serves everything in public/
// from the site root), so this no longer depends on lottie.host being
// reachable at runtime.
const LOTTIE_SRC = "/lottieTick.json";

// 0.5 = half speed = double the on-screen duration of the tick animation.
// Previously the tick played (and the overlay vanished) faster than the
// completion bubble's own flight, so the bubble was gone before anyone
// registered it. Slowing the tick down gives the bubble room to be seen.
const PLAYBACK_SPEED = 0.5;

// Builds the "time left" readout shown under TASK COMPLETED. Returns null
// when the task had no due date, so the line is simply omitted.
function formatTimeLeft(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;

  const diffMs = due.getTime() - Date.now();
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);

  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  if (days === 0) parts.push(`${minutes}m`);
  const readable = parts.slice(0, 2).join(" ") || "0m";

  return overdue ? `${readable} overdue` : `${readable} left`;
}

export default function TaskCompleteLottie() {
  // Reusing the existing confettiTrigger signal — it's fired from the same
  // single spot (taskStore.js's centralized completion trigger) whether the
  // task was completed via the "Mark Complete" button or a Kanban drag into
  // Done, so this component just needs to react to it the same way
  // ConfettiOverlay used to.
  const confettiTrigger = useUIStore((s) => s.confettiTrigger);
  const lastCompletedDueDate = useUIStore((s) => s.lastCompletedDueDate);
  // Baseline captured once, on mount, and compared by value (not a one-shot
  // boolean) — same StrictMode-safe pattern as the rest of the app's
  // trigger signals, so a dev-only double-invoke of this effect on initial
  // mount doesn't cause a spurious play.
  const lastHandledTrigger = useRef(confettiTrigger);
  const [visible, setVisible] = useState(false);
  const [timeLeftText, setTimeLeftText] = useState(null);
  const dotLottieRef = useRef(null);

  useEffect(() => {
    if (confettiTrigger === lastHandledTrigger.current) return;
    lastHandledTrigger.current = confettiTrigger;

    setVisible(true);
    setTimeLeftText(formatTimeLeft(lastCompletedDueDate));

    const dl = dotLottieRef.current;
    if (dl) {
      dl.stop();
      dl.setSpeed(PLAYBACK_SPEED);
      dl.play();
    }
  }, [confettiTrigger, lastCompletedDueDate]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.15s linear",
      }}
    >
      <div style={{ width: 320, height: 320 }}>
        <DotLottieReact
          src={LOTTIE_SRC}
          autoplay={false}
          loop={false}
          speed={PLAYBACK_SPEED}
          dotLottieRefCallback={(instance) => {
            dotLottieRef.current = instance;
            if (!instance) return;
            // Hide the overlay once the animation finishes playing so it
            // doesn't sit there as a frozen last-frame image, and so the
            // next trigger starts from a clean, invisible state.
            instance.addEventListener("complete", () => setVisible(false));
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div
        style={{
          marginTop: -8,
          textAlign: "center",
          transform: visible ? "translateY(0)" : "translateY(6px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: "#fff",
            textShadow: "0 2px 10px rgba(0,0,0,0.4)",
          }}
        >
          TASK COMPLETED
        </div>
        {timeLeftText && (
          <div
            style={{
              marginTop: 4,
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
              textShadow: "0 1px 6px rgba(0,0,0,0.35)",
            }}
          >
            {timeLeftText}
          </div>
        )}
      </div>
    </div>
  );
}
