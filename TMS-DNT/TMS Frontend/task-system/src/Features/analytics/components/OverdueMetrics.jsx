import { useEffect, useState } from "react";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import Card from "../../../components/ui/Card";
import { analyticsApi } from "../../../api/analyticsApi";

export default function OverdueMetrics() {
  const [metrics, setMetrics] = useState({
    totalOverdue: 0,
    avgDaysLate: 0,
    changeFromLastWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getOverdue().then(setMetrics).finally(() => setIsLoading(false));
  }, []);

  const isImproving = metrics.changeFromLastWeek < 0;
  const TrendIcon = isImproving ? TrendingDown : TrendingUp;

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-dark mb-4">Overdue Metrics</h3>

      {isLoading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : (
        <>
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
            <TrendIcon
              size={14}
              className={isImproving ? "text-success-text" : "text-danger-text"}
            />
            <span className={isImproving ? "text-success-text" : "text-danger-text"}>
              {Math.abs(metrics.changeFromLastWeek)}%{" "}
              {isImproving ? "improvement" : "increase"} vs last week
            </span>
          </div>
        </>
      )}
    </Card>
  );
}