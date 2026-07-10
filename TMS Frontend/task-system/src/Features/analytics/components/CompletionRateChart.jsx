import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Card from "../../../components/ui/Card";

const data = [
  { week: "W1", rate: 62 },
  { week: "W2", rate: 70 },
  { week: "W3", rate: 65 },
  { week: "W4", rate: 78 },
  { week: "W5", rate: 82 },
  { week: "W6", rate: 88 },
];

export default function CompletionRateChart() {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-dark mb-4">
        Completion Rate Over Time
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F9F3F1" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12, fill: "#515A47" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#515A47" }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #CDF3D9",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#9DC0BC"
              strokeWidth={2.5}
              dot={{ fill: "#9DC0BC", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
