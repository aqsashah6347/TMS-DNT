import { useState } from "react";
import Calendar from "react-calendar";

export default function CalendarPreview() {
  const [date, setDate] = useState(new Date());

  return (
    <div className="calendar-widget">
      <Calendar
        onChange={setDate}
        value={date}
        className="tms-calendar"
        showNeighboringMonth={true}
        prevLabel="‹"
        nextLabel="›"
        prev2Label="«"
        next2Label="»"
      />
    </div>
  );
}
