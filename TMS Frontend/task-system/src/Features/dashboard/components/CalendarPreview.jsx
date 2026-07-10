import { useEffect, useState } from "react";
import Calendar from "react-calendar";

export default function CalendarPreview() {
  const [now, setNow] = useState(new Date());
  const [date, setDate] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const goToToday = () => {
    const today = new Date();
    setNow(today);
    setDate(today);
    setActiveStartDate(today);
  };

  return (
    <div className="calendar-widget">
      <div className="calendar-top">
        <div>
          <p className="calendar-date">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>

          <span className="calendar-time">
            {now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>

        <button className="today-btn" onClick={goToToday}>
          Today
        </button>
      </div>

      <Calendar
        value={date}
        onChange={(value) => setDate(value)}
        activeStartDate={activeStartDate}
        onActiveStartDateChange={({ activeStartDate }) => {
          if (activeStartDate) {
            setActiveStartDate(activeStartDate);
          }
        }}
        className="tms-calendar"
        showNeighboringMonth={true}
        prevLabel="❮"
        nextLabel="❯"
        prev2Label={null}
        next2Label={null}
      />
    </div>
  );
}
