import CompletionRateChart from "../features/analytics/components/CompletionRateChart";
import OverdueMetrics from "../features/analytics/components/OverdueMetrics";
import ProductivityChart from "../features/analytics/components/ProductivityChart";
import WorkloadDistribution from "../features/analytics/components/WorkloadDistribution";

export default function Analytics() {
  return (
    <div>
      <h2
        className="text-4xl font-semibold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Analytics
      </h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <CompletionRateChart />
        </div>
        <OverdueMetrics />

        <ProductivityChart />
        <WorkloadDistribution />
      </div>
    </div>
  );
}
