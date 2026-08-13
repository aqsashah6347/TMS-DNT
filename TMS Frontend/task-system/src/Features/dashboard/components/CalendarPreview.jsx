import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { Locate } from "lucide-react";
import { useTaskStore } from "../../tasks/taskStore";

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addMonths(date, amount) {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + amount);
  return d;
}

// Local (not UTC) YYYY-MM-DD, matching how dueDate is stored/compared
// elsewhere (e.g. TaskCalendarView) so the dot lines up with the same day
// the task list shows, regardless of timezone offset.
function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function AnalogClock({ onClick }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const point = (deg, radius) => ({
    x: 100 + radius * Math.sin(toRad(deg)),
    y: 100 - radius * Math.cos(toRad(deg)),
  });

  const ticks = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div
      className="analog-clock-box"
      onClick={onClick}
      role="button"
      tabIndex={0}
      title="Jump to today"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <svg viewBox="0 0 200 200" className="analog-clock-face">
        <circle cx="100" cy="100" r="96" className="clock-rim" />

        {ticks.map((i) => {
          const deg = i * 30;
          const isMajor = i % 3 === 0;
          const outer = point(deg, 84);
          const inner = point(deg, isMajor ? 68 : 76);
          return (
            <line
              key={i}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              className={isMajor ? "clock-tick-major" : "clock-tick-minor"}
            />
          );
        })}

        <line
          x1="100"
          y1="100"
          x2={point(hourDeg, 44).x}
          y2={point(hourDeg, 44).y}
          className="clock-hand-hour"
        />
        <line
          x1="100"
          y1="100"
          x2={point(minuteDeg, 62).x}
          y2={point(minuteDeg, 62).y}
          className="clock-hand-minute"
        />
        <line
          x1={point(secondDeg + 180, 14).x}
          y1={point(secondDeg + 180, 14).y}
          x2={point(secondDeg, 70).x}
          y2={point(secondDeg, 70).y}
          className="clock-hand-second"
        />
        <circle cx="100" cy="100" r="5" className="clock-hub" />
      </svg>
    </div>
  );
}

export default function CalendarPreview() {
  const [date, setDate] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(new Date());

  const allTasksFull = useTaskStore((s) => s.allTasksFull);
  const fetchAllTasksFull = useTaskStore((s) => s.fetchAllTasksFull);
  const openTaskView = useTaskStore((s) => s.openTaskView);

  useEffect(() => {
    fetchAllTasksFull();
  }, [fetchAllTasksFull]);

  // Group due tasks by local date string. allTasksFull is already scoped
  // to what this user can see (their own + created-by-them tasks for
  // "user", their team's for "manager", everything for "admin" — see
  // taskController.getAllTasks), so no extra client-side filtering by
  // assignedTo is needed here. That extra filter was the actual bug:
  // for anyone whose id isn't the assignee on their own tasks (admins,
  // managers, or a "user" who mostly creates tasks for others) it wiped
  // the list down to nothing, so no dots ever rendered — meaning there
  // was nothing to hover or click in the first place.
  //
  // dueDate normally comes back as a plain "YYYY-MM-DD" string from the
  // API, but this also tolerates a full ISO timestamp by taking just the
  // date portion, so a format mismatch can't silently make the dot
  // disappear.
  const tasksByDueDate = allTasksFull
    .filter((t) => t.dueDate)
    .reduce((acc, t) => {
      const key = String(t.dueDate).slice(0, 10);
      (acc[key] ||= []).push(t);
      return acc;
    }, {});

  const goToToday = () => {
    const today = new Date();
    setDate(today);
    setActiveStartDate(today);
  };

  const handleDayClick = (clickedDate) => {
    // A day with one of your tasks due opens that task straight away
    // instead of just selecting the day.
    const dayTasks = tasksByDueDate[toDateStr(clickedDate)];
    if (dayTasks && dayTasks.length > 0) {
      openTaskView(dayTasks[0]);
      return;
    }

    if (isSameDay(clickedDate, new Date())) {
      goToToday();
      return;
    }
    setDate(clickedDate);
  };

  // Clicking a specific task row in the tooltip opens that task (rather
  // than always the first one due that day, which the tile click below
  // still does as a shortcut).
  const handleTaskClick = (e, task) => {
    e.stopPropagation();
    openTaskView(task);
  };

  const monthLabel = activeStartDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="calendar-stack">
      <AnalogClock onClick={goToToday} />

      <div className="calendar-widget">
        <div className="tms-calendar-header">
          <button
            type="button"
            className="tms-nav-arrow"
            onClick={() => setActiveStartDate((prev) => addMonths(prev, -1))}
            aria-label="Previous month"
          >
            ‹
          </button>

          <div className="tms-calendar-label-group">
            <span className="tms-calendar-label">{monthLabel}</span>
            <button
              type="button"
              className="calendar-today-jump"
              onClick={goToToday}
              aria-label="Jump to today"
              title="Jump to today"
            >
              <Locate size={12} />
            </button>
          </div>

          <button
            type="button"
            className="tms-nav-arrow"
            onClick={() => setActiveStartDate((prev) => addMonths(prev, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <Calendar
          value={date}
          onChange={handleDayClick}
          activeStartDate={activeStartDate}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              setActiveStartDate(activeStartDate);
            }
          }}
          showNavigation={false}
          className="tms-calendar"
          showNeighboringMonth={true}
          tileContent={({ date: tileDate, view }) => {
            if (view !== "month") return null;
            const key = toDateStr(tileDate);
            const dayTasks = tasksByDueDate[key];
            if (!dayTasks || dayTasks.length === 0) return null;

            const isSelected = isSameDay(tileDate, date);

            return (
              // Pure CSS :hover drives the tooltip (see .calendar-hover-zone
              // and .calendar-task-tooltip in index.css) instead of React
              // state — no onMouseEnter/onMouseLeave to get out of sync.
              <span
                className="calendar-hover-zone"
                onClick={(e) => {
                  // Explicit, rather than relying on this bubbling up to
                  // react-calendar's own tile button handler — guarantees
                  // the click opens the task no matter how that internal
                  // wiring behaves.
                  e.stopPropagation();
                  handleDayClick(tileDate);
                }}
              >
                <span
                  className={`calendar-due-dot${isSelected ? " calendar-due-dot--selected" : ""}`}
                />

                <div className="calendar-task-tooltip" role="tooltip">
                  <p className="calendar-task-tooltip__heading">
                    {dayTasks.length === 1
                      ? "1 task due"
                      : `${dayTasks.length} tasks due`}
                  </p>
                  <ul className="calendar-task-tooltip__list">
                    {dayTasks.map((t) => (
                      <li key={t.id}>
                        {/* Not a <button> on purpose — this sits inside
                            tileContent, which react-calendar already
                            renders inside its own <button> for the tile.
                            A <button> nested in a <button> is invalid
                            HTML; browsers close the outer one early when
                            they hit it, which corrupts the tile's DOM and
                            is what was breaking hover/click on the
                            calendar. */}
                        <div
                          role="button"
                          tabIndex={0}
                          className="calendar-task-tooltip__item"
                          onClick={(e) => handleTaskClick(e, t)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleTaskClick(e, t);
                            }
                          }}
                        >
                          {t.title}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <span className="calendar-task-tooltip__arrow" />
                </div>
              </span>
            );
          }}
        />
      </div>
    </div>
  );
}
