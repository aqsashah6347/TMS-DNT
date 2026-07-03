import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

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
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 bg-primary-light/30 rounded-card px-4 py-3">
      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
        <Clock size={16} className="text-dark" />
      </div>
      <div>
        <p className="text-sm font-semibold text-dark">{dateStr}</p>
        <p className="text-xs text-muted tabular-nums">{timeStr}</p>
      </div>
    </div>
  );
}
