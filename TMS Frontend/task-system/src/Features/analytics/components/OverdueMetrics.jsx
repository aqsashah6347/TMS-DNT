import { AlertTriangle, TrendingDown } from "lucide-react";
import Card from "../../../components/ui/Card";

const metrics = { totalOverdue: 7, avgDaysLate: 2.3, changeFromLastWeek: -18 };

export default function OverdueMetrics() {
  const isImproving = metrics.changeFromLastWeek < 0;

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-dark mb-4">Overdue Metrics</h3>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center">
          <AlertTriangle size={18} className="text-danger-text" />
        </div>
        <div>
          <p className="text-2xl font-bold text-dark">{metrics.totalOverdue}</p>
          <p className="text-xs text-muted">tasks overdue right now</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm border-t border-primary-light pt-3">
        <span className="text-muted">Avg. days late</span>
        <span className="text-dark font-medium">{metrics.avgDaysLate}</span>
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-xs">
        <TrendingDown
          size={14}
          className={isImproving ? "text-success-text" : "text-danger-text"}
        />
        <span
          className={isImproving ? "text-success-text" : "text-danger-text"}
        >
          {Math.abs(metrics.changeFromLastWeek)}%{" "}
          {isImproving ? "improvement" : "increase"} vs last week
        </span>
      </div>
    </Card>
  );
}
