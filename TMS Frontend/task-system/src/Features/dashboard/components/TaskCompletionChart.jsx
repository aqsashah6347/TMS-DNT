import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Placeholder data — swap this with real data from your API later,
// e.g. const data = await taskApi.getCompletionStats()
const data = [
  { day: "Mon", completed: 4 },
  { day: "Tue", completed: 7 },
  { day: "Wed", completed: 5 },
  { day: "Thu", completed: 9 },
  { day: "Fri", completed: 6 },
  { day: "Sat", completed: 3 },
  { day: "Sun", completed: 8 },
];

export default function TaskCompletionChart() {
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
