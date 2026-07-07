import { useState, useEffect } from "react";

export default function DateTimeBox() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="datetime-box">
      <p className="datetime-box__date">{dateStr}</p>
      <p className="datetime-box__time tabular-nums">{timeStr}</p>
    </div>
  );
}
