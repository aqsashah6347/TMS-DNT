// Lightweight week-strip preview — no calendar library needed, keeps the dashboard fast.
// Full calendar view (for the Tasks module) will be a separate, heavier component.

const today = new Date();
const weekDays = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() - today.getDay() + i);
  return d;
});

// Placeholder — later from taskApi.getTasks({ dueThisWeek: true })
const taskCountByDay = { 1: 2, 3: 1, 5: 3 }; // keyed by day index (0=Sun)

export default function CalendarPreview() {
  return (
    <div className="flex justify-between">
      {weekDays.map((date, i) => {
        const isToday = date.toDateString() === today.toDateString();
        const count = taskCountByDay[i] || 0;

        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-muted uppercase">
              {date
                .toLocaleDateString("en-US", { weekday: "short" })
                .slice(0, 2)}
            </span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                isToday ? "bg-primary text-dark" : "text-dark"
              }`}
            >
              {date.getDate()}
            </div>
            {count > 0 && (
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                  <span key={j} className="w-1 h-1 rounded-full bg-primary" />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
