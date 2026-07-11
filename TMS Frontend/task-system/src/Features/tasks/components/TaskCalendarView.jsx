import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTaskStore } from "../taskStore";

export default function TaskCalendarView({ tasks }) {
  const [current, setCurrent] = useState(new Date());
  const openTaskView = useTaskStore((s) => s.openTaskView);

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
              onClick={() => hasTasks && openTaskView(dayTasks[0])}
              className={`aspect-square sm:aspect-auto sm:min-h-[100px] rounded-xl p-1.5 sm:p-2 flex flex-col transition-colors ${
                hasTasks
                  ? "bg-orange-400/12 border border-orange-400/40 shadow-[0_0_14px_rgba(251,146,60,0.15)] cursor-pointer hover:bg-orange-400/20"
                  : "bg-white/[0.03] border border-white/[0.06]"
              }`}
            >
              <span
                className={`text-sm sm:text-lg font-bold leading-none ${
                  isToday
                    ? "inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-400 text-[#18181b]"
                    : hasTasks
                      ? "text-orange-300"
                      : "text-white/80"
                }`}
              >
                {day}
              </span>

              <div className="flex flex-col gap-0.5 sm:gap-1 mt-1 sm:mt-2 overflow-hidden text-left">
                {visibleTasks.map((t) => (
                  <span
                    key={t.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openTaskView(t);
                    }}
                    className="text-[10px] sm:text-sm font-semibold text-white/90 truncate hover:text-orange-300 transition-colors"
                    title={t.title}
                  >
                    {t.title}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="text-[10px] sm:text-xs font-semibold text-orange-300/80">
                    +{extraCount} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
