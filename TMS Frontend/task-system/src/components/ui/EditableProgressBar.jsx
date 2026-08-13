// Shared editable progress control used by TaskCard and DailyProgress.
// Same interaction model in both places:
//  - click anywhere on the track to set a value
//  - arrow keys (track focused, or the number field) nudge by 1, Home/End jump to 0/100
//  - type a value directly into the number field
//  - Enter commits, same as pressing the small save button
// None of the above persists anything on its own — changes stay "pending"
// (shown via the dirty save button + unsaved-hint) until the save button
// (or Enter) is used. The bar visual itself is unchanged from before.
import { useEffect, useRef, useState, useCallback } from "react";
import { Check, Loader2, Save } from "lucide-react";

function clamp(n) {
  return Math.max(0, Math.min(100, n));
}

function formatMarkTimestamp(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Small tick on the track marking a past saved commit (DailyProgress only).
function ProgressMark({ mark }) {
  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-auto cursor-help group/mark z-10"
      style={{ left: `${mark.progress}%`, width: 6, marginLeft: -3 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mx-auto h-full w-[2px] rounded-full bg-white/85 shadow-[0_0_2px_rgba(0,0,0,0.6)]" />
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center opacity-0 scale-95 group-hover/mark:opacity-100 group-hover/mark:scale-100 transition-all duration-150 z-30">
        <div className="whitespace-nowrap rounded-lg border border-white/10 bg-[#1a1a1e] px-2.5 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
          <p className="text-[11px] font-medium text-white leading-tight">
            {formatMarkTimestamp(mark.createdAt)}
          </p>
          <p className="text-[10px] text-white/45 leading-tight mt-0.5">
            Set to {mark.progress}%
          </p>
        </div>
        <div className="-mt-[5px] h-2.5 w-2.5 rotate-45 border-b border-r border-white/10 bg-[#1a1a1e]" />
      </div>
    </div>
  );
}

/**
 * @param {number} progress - last saved value (0-100)
 * @param {string} color - fill color
 * @param {(value: number) => Promise<boolean>} onSave - called only when the
 *   user explicitly commits (save button or Enter). Return false on failure.
 * @param {Array<{progress:number, createdAt:string}>} [marks] - optional
 *   history ticks shown on the track (used on the Daily Progress page).
 */
export default function EditableProgressBar({
  progress,
  color,
  onSave,
  marks = [],
  className = "",
}) {
  const savedValue = clamp(Math.round(Number(progress) || 0));
  const [draft, setDraft] = useState(savedValue);
  const [inputText, setInputText] = useState(String(savedValue));
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [hovering, setHovering] = useState(false);
  const trackRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Stay in sync with the saved value from the server, but never clobber
  // an in-flight save.
  useEffect(() => {
    if (saveState !== "saving") {
      setDraft(savedValue);
      setInputText(String(savedValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedValue]);

  useEffect(() => () => clearTimeout(saveTimeoutRef.current), []);

  const isDirty = draft !== savedValue;

  const applyDraft = (next) => {
    const v = clamp(Math.round(next));
    setDraft(v);
    setInputText(String(v));
    setSaveState("idle");
  };

  const percentFromEvent = (e) => {
    const track = trackRef.current;
    if (!track) return draft;
    const rect = track.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    return Math.round((x / rect.width) * 100);
  };

  const handleSave = useCallback(
    async (e) => {
      e?.stopPropagation?.();
      if (!isDirty || saveState === "saving") return;
      clearTimeout(saveTimeoutRef.current);
      setSaveState("saving");
      const ok = await onSave?.(draft);
      setSaveState(ok ? "saved" : "error");
      saveTimeoutRef.current = setTimeout(() => setSaveState("idle"), 1500);
    },
    [draft, isDirty, saveState, onSave],
  );

  const handleTrackClick = (e) => {
    e.stopPropagation();
    applyDraft(percentFromEvent(e));
  };

  const handleTrackKeyDown = (e) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        applyDraft(draft + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        applyDraft(draft - 1);
        break;
      case "Home":
        e.preventDefault();
        applyDraft(0);
        break;
      case "End":
        e.preventDefault();
        applyDraft(100);
        break;
      case "Enter":
        e.preventDefault();
        handleSave();
        break;
      default:
        break;
    }
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      setInputText("");
      return;
    }
    if (!/^\d{1,3}$/.test(raw)) return;
    setInputText(raw);
    setDraft(clamp(parseInt(raw, 10) || 0));
    setSaveState("idle");
  };

  const handleInputBlur = () => {
    applyDraft(inputText === "" ? 0 : parseInt(inputText, 10) || 0);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyDraft(inputText === "" ? 0 : parseInt(inputText, 10) || 0);
      handleSave();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      applyDraft((inputText === "" ? draft : parseInt(inputText, 10) || 0) + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      applyDraft((inputText === "" ? draft : parseInt(inputText, 10) || 0) - 1);
    }
  };

  // Keep the hover label from clipping off the ends of the bar.
  const labelLeft = Math.min(94, Math.max(6, draft));

  return (
    <div
      className={`epb-row ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="epb-track-wrap"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div
          ref={trackRef}
          className="mask-progress-bar epb-track"
          role="slider"
          tabIndex={0}
          aria-label="Task progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={draft}
          style={{
            backgroundImage: `linear-gradient(${color}, ${color})`,
            backgroundSize: `${draft}% 100%`,
          }}
          onClick={handleTrackClick}
          onKeyDown={handleTrackKeyDown}
        >
          {marks.length > 0 &&
            marks.map((mark, i) => (
              <ProgressMark
                key={mark.createdAt ? `${mark.createdAt}-${i}` : i}
                mark={mark}
              />
            ))}
        </div>

        {hovering && (
          <div className="epb-hover-box" style={{ left: `${labelLeft}%` }}>
            {draft}%
          </div>
        )}
      </div>

      <div className="epb-controls">
        <input
          type="text"
          inputMode="numeric"
          value={inputText}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="epb-input"
          aria-label="Progress percent"
        />
        <span className="epb-percent-sign">%</span>

        <button
          type="button"
          className={`epb-save-btn ${isDirty ? "epb-save-btn--dirty" : ""}`}
          onClick={handleSave}
          disabled={!isDirty || saveState === "saving"}
          title={isDirty ? "Save progress" : "No changes to save"}
        >
          {saveState === "saving" ? (
            <Loader2 size={12} className="epb-spin" />
          ) : saveState === "saved" ? (
            <Check size={12} />
          ) : (
            <Save size={12} />
          )}
        </button>
      </div>
    </div>
  );
}
