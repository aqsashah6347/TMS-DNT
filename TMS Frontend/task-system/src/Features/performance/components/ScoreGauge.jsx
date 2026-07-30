// src/Features/performance/components/ScoreGauge.jsx
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { scoreColor } from "../utils";

// Reusable circular gauge — used for the big final score and the small
// per-metric scores (Achievement / Difficulty / Efficiency / Quality),
// so every number in the performance formula gets the same graphical
// treatment.
export default function ScoreGauge({
  score,
  size = 96,
  thickness = 9,
  label,
  caption,
}) {
  const value = score ?? 0;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div style={{ width: size, height: size }} className="relative shrink-0">
        <RadialBarChart
          width={size}
          height={size}
          cx="50%"
          cy="50%"
          innerRadius={size / 2 - thickness}
          outerRadius={size / 2}
          barSize={thickness}
          data={[{ value }]}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <RadialBar
            dataKey="value"
            cornerRadius={thickness / 2}
            fill={color}
            background={{ fill: "rgba(255,255,255,0.06)" }}
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="font-semibold text-white"
            style={{ fontSize: size * 0.26, fontFamily: "var(--font-display)" }}
          >
            {score === null || score === undefined ? "—" : score}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider text-center">
          {label}
        </span>
      )}
      {caption && (
        <span className="text-[10px] text-white/30 text-center -mt-1">
          {caption}
        </span>
      )}
    </div>
  );
}
