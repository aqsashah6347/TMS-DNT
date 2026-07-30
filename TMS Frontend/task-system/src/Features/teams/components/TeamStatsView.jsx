import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Pencil } from "lucide-react";
import Avatar from "../../../components/ui/Avatar";
import RadialProgress from "../../../components/ui/RadialProgress";
import Button from "../../../components/ui/Button";
import { useTaskStore } from "../../tasks/taskStore";
import { DEFAULT_TEAM_COLOR } from "../../../utils/teamColors";

const STATUS_META = {
  backlog: { label: "Backlog", color: "#a1a1aa" },
  "in progress": { label: "In Progress", color: "#ffd27f" },
  review: { label: "Review", color: "#b490f5" },
  done: { label: "Done", color: "#a8f08a" },
};

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;
  return new Date(task.dueDate) < new Date();
}

export default function TeamStatsView({
  team,
  teamProjects,
  canManageTeam,
  onEdit,
}) {
  const allTasks = useTaskStore((s) => s.allTasksFull);

  const members = team.memberDetails || [];
  const color = team.color || DEFAULT_TEAM_COLOR;

  // Team's task pool: anything assigned to a current member, or filed
  // under one of the team's projects (covers tasks whose assignee has
  // since left the team).
  const teamTasks = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.id));
    const projectIds = new Set(teamProjects.map((p) => p.id));
    return allTasks.filter(
      (t) => memberIds.has(t.assignedTo) || projectIds.has(t.projectId),
    );
  }, [allTasks, members, teamProjects]);

  const statusCounts = useMemo(() => {
    const counts = { backlog: 0, "in progress": 0, review: 0, done: 0 };
    teamTasks.forEach((t) => {
      const key = Object.prototype.hasOwnProperty.call(counts, t.status)
        ? t.status
        : "backlog";
      counts[key] += 1;
    });
    return counts;
  }, [teamTasks]);

  const totalTasks = teamTasks.length;
  const doneCount = statusCounts.done;
  const completionPct =
    totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const overdueCount = teamTasks.filter(isOverdue).length;

  const chartData = Object.entries(STATUS_META).map(([key, meta]) => ({
    status: meta.label,
    count: statusCounts[key] || 0,
    color: meta.color,
  }));

  const memberStats = useMemo(() => {
    return members.map((m) => {
      const mine = allTasks.filter((t) => t.assignedTo === m.id);
      const done = mine.filter((t) => t.status === "done").length;
      const total = mine.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const overdue = mine.filter(isOverdue).length;
      const projectNames = [
        ...new Set(
          mine
            .map((t) => teamProjects.find((p) => p.id === t.projectId)?.name)
            .filter(Boolean),
        ),
      ];
      return { ...m, total, done, pct, overdue, projectNames };
    });
  }, [members, allTasks, teamProjects]);

  const createdDate = formatDate(team.createdAt || team.created_at);

  return (
    <div className="team-stats">
      {/* Hero: identity + headline numbers, side by side rather than stacked */}
      <div className="team-stats__hero">
        <div className="team-stats__hero-identity">
          <span
            className="team-stats__dot"
            style={{ background: color }}
            aria-hidden="true"
          />
          <div>
            <p className="team-stats__eyebrow">Managed by</p>
            <div className="team-stats__manager">
              <Avatar name={team.managerName} size={22} />
              <span className="team-stats__manager-name">
                {team.managerName || "Unassigned"}
              </span>
            </div>
          </div>
        </div>

        <div className="team-stats__hero-stats">
          <div className="team-stats__stat">
            <span className="team-stats__stat-value">{members.length}</span>
            <span className="team-stats__stat-label">Members</span>
          </div>
          <div className="team-stats__stat">
            <span
              className="team-stats__stat-value"
              style={{ color: "var(--color-accent-amber)" }}
            >
              {teamProjects.length}
            </span>
            <span className="team-stats__stat-label">Projects</span>
          </div>
          <div className="team-stats__stat">
            <span
              className="team-stats__stat-value"
              style={{ color: "var(--color-accent-primary)" }}
            >
              {totalTasks}
            </span>
            <span className="team-stats__stat-label">Tasks</span>
          </div>
          <div className="team-stats__stat">
            <span
              className="team-stats__stat-value"
              style={{
                color:
                  overdueCount > 0
                    ? "var(--color-accent-danger)"
                    : "var(--color-accent-lime)",
              }}
            >
              {overdueCount}
            </span>
            <span className="team-stats__stat-label">Overdue</span>
          </div>
        </div>
      </div>

      {team.description && (
        <p className="team-stats__description">{team.description}</p>
      )}

      {/* Bento row: completion ring beside the status breakdown chart */}
      <div className="team-stats__bento-row">
        <div className="team-stats__cell team-stats__cell--pulse">
          <p className="team-stats__cell-label">Team Pulse</p>
          <RadialProgress
            value={completionPct}
            size={104}
            strokeWidth={9}
            color={color}
          >
            <span className="team-stats__ring-pct">{completionPct}%</span>
            <span className="team-stats__ring-caption">complete</span>
          </RadialProgress>
          <p className="team-stats__pulse-footer">
            {doneCount} of {totalTasks} task{totalTasks === 1 ? "" : "s"} done
          </p>
        </div>

        <div className="team-stats__cell team-stats__cell--breakdown">
          <p className="team-stats__cell-label">Status Breakdown</p>
          {totalTasks === 0 ? (
            <p className="team-stats__empty">No tasks assigned yet.</p>
          ) : (
            <div className="team-stats__chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: -6, right: 20, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="status"
                    width={82}
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      background: "#17130f",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                    {chartData.map((d) => (
                      <Cell key={d.status} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Roster — each member gets their own progress ring + project chips */}
      <div className="team-stats__section">
        <div className="team-stats__section-head">
          <p className="team-stats__cell-label">Roster</p>
          <span className="team-stats__section-count">{members.length}</span>
        </div>

        {members.length === 0 ? (
          <p className="team-stats__empty">No members yet.</p>
        ) : (
          <div className="team-stats__member-grid">
            {memberStats.map((m) => {
              const isManager = m.id === team.managerId;
              return (
                <div key={m.id} className="team-stats__member-card">
                  <div className="team-stats__member-top">
                    <Avatar name={m.name} color={m.avatarColor} size={34} />
                    <div className="team-stats__member-id">
                      <p className="team-stats__member-name">{m.name}</p>
                      <p className="team-stats__member-role">
                        {isManager ? "Manager" : m.role || "Member"}
                      </p>
                    </div>
                    <RadialProgress
                      value={m.pct}
                      size={38}
                      strokeWidth={4}
                      color={color}
                    >
                      <span className="team-stats__member-ring-pct">
                        {m.pct}%
                      </span>
                    </RadialProgress>
                  </div>

                  <div className="team-stats__member-metrics">
                    <span>
                      {m.done}/{m.total} done
                    </span>
                    {m.overdue > 0 && (
                      <span className="team-stats__member-overdue">
                        {m.overdue} overdue
                      </span>
                    )}
                  </div>

                  <div className="team-stats__member-projects">
                    {m.projectNames.length === 0 ? (
                      <span className="team-stats__chip team-stats__chip--empty">
                        No active projects
                      </span>
                    ) : (
                      <>
                        {m.projectNames.slice(0, 2).map((name) => (
                          <span key={name} className="team-stats__chip">
                            {name}
                          </span>
                        ))}
                        {m.projectNames.length > 2 && (
                          <span className="team-stats__chip team-stats__chip--more">
                            +{m.projectNames.length - 2}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Projects assigned to this team, each with its own progress bar */}
      <div className="team-stats__section">
        <div className="team-stats__section-head">
          <p className="team-stats__cell-label">Projects</p>
          <span className="team-stats__section-count">
            {teamProjects.length}
          </span>
        </div>

        {teamProjects.length === 0 ? (
          <p className="team-stats__empty">No projects for this team yet.</p>
        ) : (
          <div className="team-stats__project-grid">
            {teamProjects.map((p) => (
              <div key={p.id} className="team-stats__project-card">
                <div className="team-stats__project-head">
                  <span
                    className="team-stats__project-dot"
                    style={{ background: p.color || color }}
                  />
                  <span className="team-stats__project-name">{p.name}</span>
                  <span className="team-stats__project-pct">
                    {p.progress ?? 0}%
                  </span>
                </div>
                <div className="team-stats__project-track">
                  <div
                    className="team-stats__project-fill"
                    style={{
                      width: `${p.progress ?? 0}%`,
                      background: p.color || color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: provenance + the one action available from this view */}
      <div className="team-stats__footer">
        <span className="team-stats__footer-text">
          {team.createdByName && `Created by ${team.createdByName}`}
          {createdDate &&
            (team.createdByName ? ` · ${createdDate}` : createdDate)}
        </span>
        {canManageTeam && (
          <Button variant="primary" onClick={onEdit}>
            <Pencil size={14} className="inline mr-1.5 -mt-0.5" /> Edit Team
          </Button>
        )}
      </div>
    </div>
  );
}
