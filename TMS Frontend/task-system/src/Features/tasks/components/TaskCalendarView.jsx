import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TaskCalendarView({ tasks, onTaskClick }) {
  const [current, setCurrent] = useState(new Date());

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

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
    <div className="bg-surface rounded-card shadow-card p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrent(new Date(year, month - 1, 1))}
          className="text-muted hover:text-dark"
        >
          <ChevronLeft size={18} />
        </button>
        <h4 className="text-sm font-semibold text-dark">
          {current.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h4>
        <button
          onClick={() => setCurrent(new Date(year, month + 1, 1))}
          className="text-muted hover:text-dark"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const dateStr = day ? toDateStr(day) : null;
          const dayTasks = dateStr ? tasksByDate[dateStr] || [] : [];
          return (
            <div key={i} className="min-h-[70px] bg-bg rounded-card p-1">
              {day && (
                <>
                  <span className="text-[11px] text-muted">{day}</span>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {dayTasks.slice(0, 2).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => useTaskStore.getState().openTaskView(t)}
                        className="text-[10px] bg-primary-light text-dark rounded px-1 py-0.5 truncate text-left"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
