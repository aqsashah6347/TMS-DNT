import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Card from "../../../components/ui/Card";

const data = [
  { name: "Frontend Squad", value: 45 },
  { name: "Design Team", value: 30 },
  { name: "Unassigned", value: 25 },
];
const COLORS = ["#9DC0BC", "#CDF3D9", "#515A47"];

export default function WorkloadDistribution() {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-dark mb-4">Workload Distribution</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={40}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #CDF3D9",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#515A47" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
