import { useState } from "react";
import { Flag, Calendar, User, Pin } from "lucide-react";
import { useTaskStore } from "../taskStore";

// Fixed theme color for every card — matches the project's primary
// accent (#fb923c) instead of varying per task/project.
const ACCENT = "#fb923c";

export default function TaskCard({ task }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const openTaskView = useTaskStore((s) => s.openTaskView);

  const hasBackDetails =
    task.dueDate ||
    task.assignedToName ||
    task.assignedByName ||
    task.zoomLink ||
    task.githubLink;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 220,
        padding: 14,
        background: "#1e1e20",
        border: `3px solid ${ACCENT}`,
        borderRadius: 10,
        boxShadow: isHovered
          ? `6px 6px 0 rgba(251,146,60,0.5)`
          : `4px 4px 0 rgba(251,146,60,0.35)`,
        transform: isHovered ? "translate(-2px, -2px)" : "translate(0, 0)",
        transition: "transform 0.25s, box-shadow 0.25s",
      }}
    >
      {/* Status */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: ACCENT,
          marginBottom: 6,
        }}
      >
        {task.pinned && <Pin size={11} fill={ACCENT} />}
        {task.status}
      </span>

      {/* Title with underline-slide-in-on-hover */}
      <span
        style={{
          fontSize: 17,
          fontWeight: 900,
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: 8,
          display: "block",
          position: "relative",
          overflow: "hidden",
          lineHeight: 1.2,
        }}
      >
        {task.title}
        <span
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "90%",
            height: 2,
            backgroundColor: ACCENT,
            transform: isHovered ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s",
          }}
        />
      </span>

      {/* Description */}
      <p
        style={{
          fontSize: 12.5,
          lineHeight: 1.35,
          color: "rgba(255,255,255,0.65)",
          marginBottom: 10,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {task.description || "No description yet."}
      </p>

      {/* Meta chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            border: `1.5px solid ${ACCENT}`,
            borderRadius: 6,
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: "capitalize",
            color: "#fff",
          }}
        >
          <Flag size={11} />
          {task.priority}
        </span>

        {task.dueDate && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              border: `1.5px solid ${ACCENT}`,
              borderRadius: 6,
              fontSize: 10.5,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            <Calendar size={11} />
            {task.dueDate}
          </span>
        )}

        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            border: `1.5px solid ${ACCENT}`,
            borderRadius: 6,
            fontSize: 10.5,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          <User size={11} />
          {task.assignedToName || "Unassigned"}
        </span>
      </div>

      {/* Button — only this opens the modal now */}
      <button
        onClick={() => openTaskView(task)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          border: `2px solid ${ACCENT}`,
          borderRadius: 6,
          background: ACCENT,
          color: "#18181b",
          padding: "6px 8px",
          fontSize: 12,
          fontWeight: 900,
          textTransform: "uppercase",
          cursor: "pointer",
          width: "100%",
          transform: isPressed ? "scale(0.95)" : "scale(1)",
          transition: "transform 0.2s",
        }}
      >
        Update Task
      </button>
    </div>
  );
}