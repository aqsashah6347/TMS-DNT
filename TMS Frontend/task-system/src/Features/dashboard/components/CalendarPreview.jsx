import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { Locate } from "lucide-react";

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
          x1="100"
          y1="112"
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

  const goToToday = () => {
    const today = new Date();
    setDate(today);
    setActiveStartDate(today);
  };

  const handleDayClick = (clickedDate) => {
    if (isSameDay(clickedDate, new Date())) {
      goToToday();
      return;
    }
    setDate(clickedDate);
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
        />
      </div>
    </div>
  );
}
