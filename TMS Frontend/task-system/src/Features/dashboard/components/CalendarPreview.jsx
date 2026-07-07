import { useEffect, useState } from "react";
import Calendar from "react-calendar";

export default function CalendarPreview() {
  const [date, setDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Returns true if a tile is today's date
  const isToday = (tileDate) => {
    const today = new Date();

    return (
      tileDate.getDate() === today.getDate() &&
      tileDate.getMonth() === today.getMonth() &&
      tileDate.getFullYear() === today.getFullYear()
    );
  };

  // Jump back to today's month and select today's date
  const goToToday = () => {
    const today = new Date();

    setNow(today);
    setDate(today);
    setActiveStartDate(today);
  };

  return (
    <div className="calendar-widget">
      <div
        className="calendar-header"
        onClick={goToToday}
        title="Go to Today"
      >
        <div>
          <h3>
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>

          <span>
            {now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      </div>

      <Calendar
        className="tms-calendar"
        value={date}
        activeStartDate={activeStartDate}
        onChange={(value) => setDate(value)}
        onActiveStartDateChange={({ activeStartDate }) =>
          setActiveStartDate(activeStartDate)
        }
        tileClassName={({ date, view }) =>
          view === "month" && isToday(date) ? "today-tile" : null
        }
      />
    </div>
  );
}