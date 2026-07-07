import { useEffect, useState } from "react";
import Calendar from "react-calendar";
//import "react-calendar/dist/Calendar.css";

export default function CalendarPreview() {
  const [date, setDate] = useState(new Date());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
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

      <Calendar onChange={setDate} value={date} className="tms-calendar" />
    </div>
  );
}
