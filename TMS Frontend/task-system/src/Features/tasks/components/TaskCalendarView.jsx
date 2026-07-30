import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTaskStore } from "../taskStore";
import Modal from "../../../components/ui/Modal";

// Same fallback chain as TaskCard.jsx / TaskKanbanView.jsx: project color
// wins when the task belongs to a project, then the task's own saved
// color, then a color derived from priority.
const priorityColorHex = {
  critical: "#f87171",
  high: "#ffd27f",
  medium: "#b490f5",
  low: "#a1a1aa",
};

function effectiveColor(task) {
  if (task.projectId && task.projectColor) return task.projectColor;
  return task.color || priorityColorHex[task.priority] || "#fb923c";
}

function hexToRgba(hex, alpha) {
  const safe = (hex || "#fb923c").replace("#", "");
  const num = parseInt(safe, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function TaskCalendarView({ tasks }) {
  const [current, setCurrent] = useState(new Date());
  const openTaskView = useTaskStore((s) => s.openTaskView);

  // Holds { dateStr, tasks } for the "all tasks that day" list modal —
  // null when closed. Opened when a day has more than one task instead
  // of jumping straight into the first task's TaskModal.
  const [dayModal, setDayModal] = useState(null);

  function openDay(dateStr, dayTasks) {
    if (dayTasks.length === 1) {
      openTaskView(dayTasks[0]);
      return;
    }
    setDayModal({ dateStr, tasks: dayTasks });
  }

  function openTaskFromDayModal(task) {
    setDayModal(null);
    openTaskView(task);
  }

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const tasksByDate = tasks.reduce((acc, t) => {
    (acc[t.dueDate] ||= []).push(t);
    return acc;
  }, {});

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function toDateStr(day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div className="solid-card p-4 sm:p-6">
      {/* ---- Month heading / nav ---- */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => setCurrent(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-full text-orange-400 hover:bg-orange-400/15 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={24} className="sm:w-7 sm:h-7" />
        </button>

        <h4
          className="text-xl sm:text-3xl font-extrabold text-orange-400 tracking-wide"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {current.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h4>

        <button
          onClick={() => setCurrent(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-full text-orange-400 hover:bg-orange-400/15 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={24} className="sm:w-7 sm:h-7" />
        </button>
      </div>

      {/* ---- Weekday row ---- */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2 sm:mb-3">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-orange-300/80"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ---- Day grid ---- */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day, i) => {
          const dateStr = day ? toDateStr(day) : null;
          const dayTasks = dateStr ? tasksByDate[dateStr] || [] : [];
          const hasTasks = dayTasks.length > 0;
          const isToday = isCurrentMonth && day === today.getDate();
          const visibleTasks = dayTasks.slice(0, 2);
          const extraCount = dayTasks.length - visibleTasks.length;
          // The box itself is tinted with the first (soonest-added) task's
          // color so days read at a glance; individual task labels below
          // still get their own dot in case a day mixes colors.
          const dayColor = hasTasks ? effectiveColor(dayTasks[0]) : null;

          if (!day) {
            return (
              <div
                key={i}
                className="aspect-square sm:aspect-auto sm:min-h-[100px] rounded-xl"
              />
            );
          }

          return (
            <div
              key={i}
              onClick={() => hasTasks && openDay(dateStr, dayTasks)}
              className={`aspect-square sm:aspect-auto sm:min-h-[100px] rounded-xl p-1.5 sm:p-2 flex flex-col transition-colors border ${
                hasTasks
                  ? "cursor-pointer"
                  : "bg-white/[0.03] border-white/[0.06]"
              }`}
              style={
                hasTasks
                  ? {
                      backgroundColor: hexToRgba(dayColor, 0.12),
                      borderColor: hexToRgba(dayColor, 0.4),
                      boxShadow: `0 0 14px ${hexToRgba(dayColor, 0.15)}`,
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (hasTasks)
                  e.currentTarget.style.backgroundColor = hexToRgba(
                    dayColor,
                    0.2,
                  );
              }}
              onMouseLeave={(e) => {
                if (hasTasks)
                  e.currentTarget.style.backgroundColor = hexToRgba(
                    dayColor,
                    0.12,
                  );
              }}
            >
              <span
                className={`text-sm sm:text-lg font-bold leading-none ${
                  isToday
                    ? "inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-400 text-[#18181b]"
                    : !hasTasks && "text-white/80"
                }`}
                style={!isToday && hasTasks ? { color: dayColor } : undefined}
              >
                {day}
              </span>

              <div className="flex flex-col gap-0.5 sm:gap-1 mt-1 sm:mt-2 overflow-hidden text-left">
                {visibleTasks.map((t) => {
                  const taskColor = effectiveColor(t);
                  return (
                    <span
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openTaskView(t);
                      }}
                      className={`flex items-center gap-1 text-[10px] sm:text-sm font-semibold truncate transition-colors ${
                        t.status === "done"
                          ? "text-white/30 line-through hover:text-white/50"
                          : "text-white/90"
                      }`}
                      title={t.title}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            t.status === "done" ? "#ffffff4d" : taskColor,
                        }}
                      />
                      <span className="truncate">{t.title}</span>
                    </span>
                  );
                })}
                {extraCount > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      openDay(dateStr, dayTasks);
                    }}
                    className="text-[10px] sm:text-xs font-semibold hover:underline"
                    style={{ color: hexToRgba(dayColor, 0.85) }}
                  >
                    +{extraCount} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- "All tasks this day" list modal ---- */}
      <Modal
        isOpen={!!dayModal}
        onClose={() => setDayModal(null)}
        title={
          dayModal
            ? new Date(`${dayModal.dateStr}T00:00:00`).toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric" },
              )
            : ""
        }
      >
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          {dayModal?.tasks.map((t) => {
            const taskColor = effectiveColor(t);
            return (
              <button
                key={t.id}
                onClick={() => openTaskFromDayModal(t)}
                className="flex items-center gap-3 text-left px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      t.status === "done" ? "#ffffff4d" : taskColor,
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm font-semibold truncate ${
                      t.status === "done"
                        ? "text-white/40 line-through"
                        : "text-white/90"
                    }`}
                  >
                    {t.title}
                  </span>
                  <span className="block text-xs text-white/40 capitalize">
                    {t.status} · {t.priority}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
