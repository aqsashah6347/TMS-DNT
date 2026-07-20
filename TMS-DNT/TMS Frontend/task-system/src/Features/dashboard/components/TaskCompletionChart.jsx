import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { taskApi } from "../../../api/taskApi";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Builds a full 7-day series (oldest -> today) even for days with zero
// completions, since the backend only returns rows that have activity.
function buildSeries(rows) {
  const byDate = new Map(rows.map((r) => [r.date.slice(0, 10), r.completedCount]));

  const series = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    series.push({
      day: DAY_LABELS[d.getDay()],
      completed: byDate.get(key) || 0,
    });
  }
  return series;
}

export default function TaskCompletionChart() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    taskApi
      .getCompletionStats("7d")
      .then((rows) => {
        if (!cancelled) setData(buildSeries(rows));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Couldn't load completion stats",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <p className="text-sm text-white/40">Loading chart…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9DC0BC" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#9DC0BC" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F9F3F1" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#515A47" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#515A47" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #CDF3D9",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#9DC0BC"
            strokeWidth={2}
            fill="url(#completedGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}