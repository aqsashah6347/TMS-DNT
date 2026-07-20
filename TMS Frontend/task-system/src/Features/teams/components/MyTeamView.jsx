import Avatar from "../../../components/ui/Avatar";
import { useEffect } from "react";
import { Crown, Users, Flag, Calendar, User } from "lucide-react";
import { useTeamStore } from "../teamStore";

const statusPillClass = {
  planning: "status-pill--planning",
  active: "status-pill--active",
  completed: "status-pill--completed",
  backlog: "status-pill--backlog",
  "in progress": "status-pill--in-progress",
  review: "status-pill--review",
  done: "status-pill--done",
};

const priorityTagClass = {
  critical: "priority-tag--critical",
  high: "priority-tag--high",
  medium: "priority-tag--medium",
  low: "priority-tag--low",
};

export default function MyTeamView() {
  const {
    myTeam,
    myTeamProjects,
    myTeamTasks,
    isMyTeamLoading,
    myTeamError,
    fetchMyTeam,
  } = useTeamStore();

  useEffect(() => {
    fetchMyTeam();
  }, [fetchMyTeam]);

  if (isMyTeamLoading) {
    return (
      <p className="text-sm text-white/50 text-center py-16">
        Loading your team…
      </p>
    );
  }

  if (myTeamError) {
    return (
      <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
        {myTeamError}
      </p>
    );
  }

  if (!myTeam) {
    return (
      <div className="glass glass-card">
        <div className="glass-content text-center py-12">
          <Users size={28} className="mx-auto text-white/30 mb-3" />
          <p className="text-sm text-white/50">
            You haven't been assigned to a team yet. Ask an admin to add you to
            one.
          </p>
        </div>
      </div>
    );
  }

  const doneTasks = myTeamTasks.filter((t) => t.status === "done").length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5 items-start">
      {/* LEFT COLUMN — 1/3 width: department metadata + members */}
      <div className="flex flex-col gap-5 lg:sticky lg:top-6">
        {/* Department / manager panel */}
        <div className="bronze-panel">
          <div className="section-glass-header">
            <h3 className="section-glass-header__title truncate">
              {myTeam.name}
            </h3>
            <span className="status-pill status-pill--active shrink-0">
              {myTeam.members.length} member
              {myTeam.members.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="bronze-panel__body">
            {myTeam.description && (
              <p className="text-sm text-silver-muted leading-relaxed">
                {myTeam.description}
              </p>
            )}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 w-fit mt-4">
              <Crown size={16} className="text-amber-dim" />
              <span className="text-xs uppercase tracking-wide text-silver-muted">
                Team Manager
              </span>
              <span className="text-sm text-white font-semibold">
                {myTeam.managerName || "Not assigned"}
              </span>
            </div>
          </div>
        </div>

        {/* Members panel */}
        <div className="bronze-panel">
          <div className="section-glass-header">
            <h4 className="section-glass-header__title">Members</h4>
          </div>
          <div className="bronze-panel__body flex flex-col gap-2.5">
            {myTeam.memberDetails.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5"
              >
                <Avatar name={m.name} color={m.avatarColor} size={34} />
                <span className="text-sm text-white font-medium truncate flex-1">
                  {m.name}
                </span>
                {m.id === myTeam.managerId && (
                  <Crown size={14} className="text-amber-dim shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — 2/3 width: Projects & Tasks */}
      <div className="bronze-panel">
        <div className="section-glass-header">
          <h4 className="section-glass-header__title">Projects &amp; Tasks</h4>
          <span className="text-xs text-silver-muted font-medium shrink-0">
            {doneTasks}/{myTeamTasks.length} tasks done
          </span>
        </div>

        <div className="bronze-panel__body">
          {myTeamProjects.length === 0 ? (
            <p className="text-xs text-silver-muted text-center py-8">
              This team has no projects yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {myTeamProjects.map((project) => {
                const tasks = myTeamTasks.filter(
                  (t) => t.projectId === project.id,
                );
                return (
                  <div
                    key={project.id}
                    className="rounded-xl border border-white/10 overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3 border-l-4 bg-white/[0.03]"
                      style={{ borderLeftColor: project.color || "#c8823f" }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base font-semibold text-white truncate">
                          {project.name}
                        </span>
                        <span
                          className={`status-pill ${statusPillClass[project.status] || "status-pill--planning"}`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <span className="text-xs text-amber-dim shrink-0 font-medium">
                        {project.progress}% complete
                      </span>
                    </div>

                    {tasks.length === 0 ? (
                      <p className="text-xs text-silver-muted text-center py-4 border-t border-white/5">
                        No tasks in this project yet.
                      </p>
                    ) : (
                      <div className="flex flex-col divide-y divide-white/5 border-t border-white/5">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-base text-white truncate mb-1">
                                {task.title}
                              </p>
                              <span
                                className={`status-pill ${statusPillClass[task.status] || "status-pill--backlog"}`}
                              >
                                {task.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 text-silver-muted">
                              <span
                                className={`priority-tag ${priorityTagClass[task.priority] || "priority-tag--medium"}`}
                              >
                                <Flag size={10} className="inline -mt-0.5" />
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-xs">
                                  <Calendar size={12} />
                                  {task.dueDate}
                                </span>
                              )}
                              {task.assignedToName && (
                                <span className="flex items-center gap-1 text-xs">
                                  <User size={12} />
                                  {task.assignedToName}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
