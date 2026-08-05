// TMS Frontend/task-system/src/pages/DailyProgress.jsx — full replacement
import { useCallback, useEffect, useMemo, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import {
  CalendarCheck2,
  Clock3,
  ListChecks,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { taskApi } from "../api/taskApi";
import { useTaskStore } from "../features/tasks/taskStore";
import EditableProgressBar from "../components/ui/EditableProgressBar";

const priorityColorHex = {
  critical: "#f87171",
  high: "#ffd27f",
  medium: "#b490f5",
  low: "#a1a1aa",
};

function getAccentColor(task) {
  const rawProjectColor = task.projectColor;
  const hasValidProjectColor =
    rawProjectColor &&
    rawProjectColor !== "#ffffff" &&
    rawProjectColor !== "#fff";
  return task.projectId
    ? hasValidProjectColor
      ? rawProjectColor
      : priorityColorHex[task.priority] || "#fb923c"
    : task.color || priorityColorHex[task.priority] || "#fb923c";
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DailyProgress() {
  const openTaskEdit = useTaskStore((s) => s.openTaskEdit);
  const updateTask = useTaskStore((s) => s.updateTask);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marksByTask, setMarksByTask] = useState({});

  const loadMarks = useCallback(async (taskList) => {
    const entries = await Promise.all(
      taskList.map(async (t) => {
        try {
          const marks = await taskApi.getProgressMarks(t.id);
          return [t.id, marks];
        } catch (err) {
          return [t.id, []];
        }
      }),
    );
    setMarksByTask((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await taskApi.getDailyProgress();
      setTasks(data);
      loadMarks(data);
    } catch (err) {
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadMarks]);

  const [heatmapCursor, setHeatmapCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [heatmapData, setHeatmapData] = useState(null);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(true);

  const loadHeatmap = useCallback(async (cursorDate) => {
    setIsHeatmapLoading(true);
    try {
      const monthParam = `${cursorDate.getFullYear()}-${String(
        cursorDate.getMonth() + 1,
      ).padStart(2, "0")}`;
      const data = await taskApi.getProgressHeatmap(monthParam);
      setHeatmapData(data);
    } catch (err) {
      setHeatmapData({
        year: cursorDate.getFullYear(),
        month: cursorDate.getMonth() + 1,
        days: [],
      });
    } finally {
      setIsHeatmapLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadHeatmap(heatmapCursor);
  }, [heatmapCursor, loadHeatmap]);

  const goToPrevMonth = () =>
    setHeatmapCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  const goToNextMonth = () =>
    setHeatmapCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });

  const isTaskModalOpen = useTaskStore((s) => s.isTaskModalOpen);
  useEffect(() => {
    if (!isTaskModalOpen) {
      load();
      loadHeatmap(heatmapCursor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTaskModalOpen, load]);

  // Only fires when the user explicitly saves (button or Enter) — the bar
  // no longer writes anything while it's just being dragged/typed into.
  const handleProgressSave = async (taskId, value) => {
    const ok = await updateTask(taskId, { progress: value });
    if (ok) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, progress: value, updatedToday: true } : t,
        ),
      );
      setMarksByTask((prev) => ({
        ...prev,
        [taskId]: [
          ...(prev[taskId] || []),
          { progress: value, createdAt: new Date().toISOString() },
        ],
      }));
      loadHeatmap(heatmapCursor);
    } else {
      load();
    }
    return ok;
  };

  const updatedToday = useMemo(
    () => tasks.filter((t) => t.updatedToday),
    [tasks],
  );
  const totalCount = tasks.length;
  const doneTodayCount = updatedToday.length;
  const pct =
    totalCount > 0 ? Math.round((doneTodayCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && doneTodayCount === totalCount;

  const timeLoggedToday = updatedToday.reduce(
    (sum, t) => sum + (Number(t.actualHours) || 0),
    0,
  );

  const ringColor = allDone ? "#4ade80" : pct >= 50 ? "#fb923c" : "#f87171";

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Banner ---- */}
      <div
        className={`rounded-[18px] p-6 transition-all duration-500 glass glass--strong ${
          allDone ? "border-green-500/50" : ""
        }`}
      >
        <div className="glass-content">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <CalendarCheck2
                size={20}
                className={allDone ? "text-green-400" : "text-orange-400"}
              />
              <h2
                className="text-xl font-semibold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Daily Progress
              </h2>
              <span className="text-white/40 text-sm">— {todayLabel}</span>
            </div>
            <span
              className="glass-badge"
              style={
                allDone
                  ? {
                      background: "rgba(74,222,128,0.18)",
                      border: "1px solid rgba(74,222,128,0.4)",
                      color: "#4ade80",
                    }
                  : {
                      background: "rgba(255,210,127,0.2)",
                      border: "1px solid rgba(255,210,127,0.4)",
                      color: "var(--color-accent-amber)",
                    }
              }
            >
              {totalCount === 0
                ? "No tasks today"
                : allDone
                  ? "All caught up"
                  : "In progress"}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="grid grid-cols-3 gap-2 flex-1 min-w-0">
              <BannerStat
                icon={CheckCircle2}
                label="Tasks Updated Today"
                value={`${doneTodayCount}/${totalCount}`}
                highlight={allDone}
              />
              <BannerStat
                icon={Clock3}
                label="Time Logged Today"
                value={`${timeLoggedToday.toFixed(1)}h`}
                highlight={allDone}
              />
              <BannerStat
                icon={ListChecks}
                label="Completion"
                value={`${pct}%`}
                highlight={allDone}
              />
            </div>

            {/* ---- Completion ring: right side of the banner ---- */}
            <div
              style={{ width: 60, height: 60 }}
              className="relative shrink-0"
            >
              <RadialBarChart
                width={60}
                height={60}
                cx="50%"
                cy="50%"
                innerRadius={21}
                outerRadius={28}
                barSize={6}
                data={[{ value: pct }]}
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
                  cornerRadius={4}
                  fill={ringColor}
                  background={{ fill: "rgba(255,255,255,0.06)" }}
                />
              </RadialBarChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className="font-semibold text-white"
                  style={{ fontSize: 12, fontFamily: "var(--font-display)" }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Bento row: heatmap + task boxes ---- */}
      <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
        {/* Left column: monthly heatmap, sized to fill the card naturally */}
        <ProgressHeatmap
          data={heatmapData}
          isLoading={isHeatmapLoading}
          cursorDate={heatmapCursor}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
        />

        {/* Task boxes — most recently assigned first */}
        <div className="solid-card p-6 cascade-in">
          <h3 className="text-sm font-semibold text-white mb-4">
            Today's Tasks
          </h3>

          {isLoading && tasks.length === 0 ? (
            <p className="text-white/40 text-sm">Loading tasks…</p>
          ) : totalCount === 0 ? (
            <p className="text-white/40 text-sm">
              Nothing assigned to you right now — enjoy the calm.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {tasks.map((task) => {
                const done = task.updatedToday;
                const progress = Math.max(
                  0,
                  Math.min(100, Number(task.progress) || 0),
                );
                const barColor = getAccentColor(task);
                const due = formatDate(task.dueDate);

                return (
                  <div
                    key={task.id}
                    className={`rounded-xl p-3.5 border transition-all duration-300 ${
                      done
                        ? "bg-green-500/10 border-green-500/40"
                        : "bg-white/[0.03] border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <button
                        onClick={() => openTaskEdit(task)}
                        className="text-sm font-medium text-white line-clamp-1 hover:underline text-left"
                        title="Open task"
                      >
                        {task.title || "Untitled task"}
                      </button>
                      {done && (
                        <CheckCircle2
                          size={15}
                          className="text-green-400 shrink-0"
                        />
                      )}
                    </div>
                    <p className="text-xs text-white/40 mb-2.5">
                      {due ? `Due ${due}` : "No due date"}
                    </p>
                    <EditableProgressBar
                      progress={progress}
                      color={barColor}
                      onSave={(v) => handleProgressSave(task.id, v)}
                      marks={marksByTask[task.id] || []}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function heatColor(count) {
  if (!count || count <= 0) return "rgba(255,255,255,0.05)";
  if (count === 1) return "rgba(251,146,60,0.3)";
  if (count === 2) return "rgba(251,146,60,0.55)";
  if (count === 3) return "rgba(251,146,60,0.75)";
  return "#fb923c";
}

function ProgressHeatmap({
  data,
  isLoading,
  cursorDate,
  onPrevMonth,
  onNextMonth,
  compact = false,
}) {
  const year = data?.year ?? cursorDate.getFullYear();
  const month = data?.month ?? cursorDate.getMonth() + 1;

  const countByDate = useMemo(() => {
    const map = {};
    (data?.days || []).forEach((d) => {
      map[d.date] = d.count;
    });
    return map;
  }, [data]);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const startWeekday = firstOfMonth.getUTCDay();

    const list = [];
    for (let i = 0; i < startWeekday; i++) list.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        day,
      ).padStart(2, "0")}`;
      list.push({ day, dateStr, count: countByDate[dateStr] || 0 });
    }
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [year, month, countByDate]);

  const todayStr = new Date().toISOString().split("T")[0];
  const monthTotal = (data?.days || []).reduce((sum, d) => sum + d.count, 0);

  return (
    <div
      className={`solid-card cascade-in ${compact ? "p-4" : "p-4"}`}
      style={compact ? undefined : { maxWidth: 268 }}
    >
      <div
        className={`flex items-center justify-between flex-wrap gap-2 ${
          compact ? "mb-2.5" : "mb-3"
        }`}
      >
        <div>
          <h3
            className={`font-semibold text-white ${
              compact ? "text-xs" : "text-xs"
            }`}
          >
            {compact ? "Progress Heatmap" : "Monthly Heatmap"}
          </h3>
          {!compact && (
            <p className="text-[10px] text-white/40 mt-0.5">
              {monthTotal} update{monthTotal === 1 ? "" : "s"} in{" "}
              {new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
                "en-US",
                { month: "short", year: "numeric", timeZone: "UTC" },
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onPrevMonth}
            className={`glass-btn glass-btn--ghost !px-1.5 ${
              compact ? "!py-0.5" : "glass-btn--sm !px-1.5"
            }`}
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft size={compact ? 12 : 13} />
          </button>
          <span
            className={`text-white/70 font-medium text-center ${
              compact ? "text-[10px] w-20" : "text-[10px] w-16"
            }`}
          >
            {new Date(Date.UTC(year, month - 1, 1))
              .toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
                timeZone: "UTC",
              })
              .replace(/\s(\d)/, " '$1")}
          </span>
          <button
            onClick={onNextMonth}
            className={`glass-btn glass-btn--ghost !px-1.5 ${
              compact ? "!py-0.5" : "glass-btn--sm !px-1.5"
            }`}
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight size={compact ? 12 : 13} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-white/40 text-sm">Loading heatmap…</p>
      ) : (
        <div
          className="mx-auto"
          style={compact ? undefined : { maxWidth: 220 }}
        >
          <div
            className={`grid ${compact ? "mb-1" : "grid-cols-7 gap-1.5 mb-1.5"}`}
            style={
              compact
                ? {
                    gridTemplateColumns: "repeat(7, 18px)",
                    gap: "3px",
                    justifyContent: "center",
                  }
                : undefined
            }
          >
            {["S", "M", "T", "W", "T", "F", "S"].map((label, i) => (
              <div
                key={i}
                className={`text-white/30 text-center uppercase ${
                  compact ? "text-[8px]" : "text-[10px]"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
          <div
            className={compact ? "grid" : "grid grid-cols-7 gap-1.5"}
            style={
              compact
                ? {
                    gridTemplateColumns: "repeat(7, 18px)",
                    gap: "3px",
                    justifyContent: "center",
                  }
                : undefined
            }
          >
            {cells.map((cell, idx) =>
              cell ? (
                <div
                  key={cell.dateStr}
                  title={`${cell.dateStr}: ${cell.count} task${
                    cell.count === 1 ? "" : "s"
                  } updated`}
                  className={`flex items-center justify-center transition-colors duration-300 ${
                    compact
                      ? "w-[18px] h-[18px] rounded-[3px] border border-white/10"
                      : "aspect-square rounded-md"
                  } ${cell.dateStr === todayStr ? "ring-1 ring-white/50" : ""}`}
                  style={{ background: heatColor(cell.count) }}
                >
                  <span
                    className={`${compact ? "text-[8px]" : "text-[9px]"} ${
                      cell.count > 0 ? "text-white/80" : "text-white/25"
                    }`}
                  >
                    {cell.day}
                  </span>
                </div>
              ) : compact ? (
                <div key={`empty-${idx}`} className="w-[18px] h-[18px]" />
              ) : (
                <div key={`empty-${idx}`} />
              ),
            )}
          </div>
          <div
            className={`flex items-center justify-end gap-1 ${
              compact ? "mt-2" : "gap-1.5 mt-4"
            }`}
          >
            <span className="text-[9px] text-white/30">Less</span>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <div
                key={lvl}
                className={
                  compact ? "w-2 h-2 rounded-sm" : "w-3 h-3 rounded-sm"
                }
                style={{ background: heatColor(lvl) }}
              />
            ))}
            <span className="text-[9px] text-white/30">More</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BannerStat({ icon: Icon, label, value, highlight }) {
  return (
    <div
      className={`rounded-2xl p-2.5 min-w-0 ${
        highlight
          ? "bg-green-500/10 border border-green-500/30"
          : "bg-black/20 border border-white/10"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1 min-w-0">
        <Icon
          size={12}
          className={`shrink-0 ${highlight ? "text-green-400" : "text-orange-400"}`}
        />
        <span className="text-[9px] uppercase tracking-wider text-white/40 font-semibold truncate">
          {label}
        </span>
      </div>
      <p
        className={`text-lg font-semibold ${highlight ? "text-green-400" : "text-white"}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
    </div>
  );
}
