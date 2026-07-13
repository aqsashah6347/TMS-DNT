import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Card from "../../../components/ui/Card";
import { analyticsApi } from "../../../api/analyticsApi";

export default function ProductivityChart() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getProductivity().then(setData).finally(() => setIsLoading(false));
  }, []);

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-dark mb-4">User Productivity</h3>
      <div className="h-56">
        {isLoading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F9F3F1" />
              <XAxis
                dataKey="user"
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
              <Bar dataKey="tasks" fill="#9DC0BC" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}