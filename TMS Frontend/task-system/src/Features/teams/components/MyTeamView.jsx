import Avatar from "../../../components/ui/Avatar";
import { useEffect } from "react";
import { Crown, Users, Flag, Calendar, User } from "lucide-react";
import { useTeamStore } from "../teamStore";

const projectStatusBadge = {
  planning: "glass-badge--violet",
  active: "glass-badge--amber",
  completed: "glass-badge--primary",
};

const priorityBadge = {
  critical: "glass-badge--danger",
  high: "glass-badge--amber",
  medium: "glass-badge--violet",
  low: "glass-badge--primary",
};

const statusLabel = {
  backlog: "text-white/60",
  "in progress": "text-violet-300",
  review: "text-amber-300",
  done: "text-emerald-300",
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
    <div className="flex flex-col gap-5">
      {/* Team info + leadership */}
      <div className="glass glass-card">
        <div className="glass-content flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-white">
                {myTeam.name}
              </h3>
              {myTeam.description && (
                <p className="text-sm text-white/50 mt-1">
                  {myTeam.description}
                </p>
              )}
            </div>
            <span className="glass-badge glass-badge--primary shrink-0">
              {myTeam.members.length} member
              {myTeam.members.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 w-fit">
            <Crown size={15} className="text-amber-300" />
            <span className="text-xs text-white/40">Team Manager</span>
            <span className="text-sm text-white font-medium">
              {myTeam.managerName || "Not assigned"}
            </span>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="glass glass-card">
        <div className="glass-content">
          <h4 className="glass-card__title !text-sm text-white mb-3">
            Members
          </h4>
          <div className="flex flex-wrap gap-2">
            {myTeam.memberDetails.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 bg-white/5 rounded-full pl-1 pr-3 py-1"
              >
                <Avatar
                  name={m.name}
                  color={m.avatarColor}
                  size={24}
                  className="text-[10px]"
                />
                <span className="text-xs text-white">{m.name}</span>
                <span className="text-xs text-white">{m.name}</span>
                {m.id === myTeam.managerId && (
                  <Crown size={11} className="text-amber-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects & tasks dashboard */}
      <div className="glass glass-card">
        <div className="glass-content">
          <div className="flex items-center justify-between mb-3">
            <h4 className="glass-card__title !text-sm text-white !mb-0">
              Projects &amp; Tasks
            </h4>
            <span className="text-xs text-white/40">
              {doneTasks}/{myTeamTasks.length} tasks done
            </span>
          </div>

          {myTeamProjects.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-8">
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
                      className="flex items-center justify-between px-4 py-3 border-l-4"
                      style={{ borderLeftColor: project.color || "#f97316" }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-white truncate">
                          {project.name}
                        </span>
                        <span
                          className={`glass-badge ${projectStatusBadge[project.status]}`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <span className="text-xs text-white/40 shrink-0">
                        {project.progress}% complete
                      </span>
                    </div>

                    {tasks.length === 0 ? (
                      <p className="text-xs text-white/40 text-center py-4 border-t border-white/5">
                        No tasks in this project yet.
                      </p>
                    ) : (
                      <div className="flex flex-col divide-y divide-white/5 border-t border-white/5">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between gap-3 px-4 py-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white truncate">
                                {task.title}
                              </p>
                              <span
                                className={`status-badge capitalize ${statusLabel[task.status]}`}
                              >
                                {task.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 text-white/60">
                              <span
                                className={`glass-badge ${priorityBadge[task.priority]}`}
                              >
                                <Flag
                                  size={10}
                                  className="inline mr-1 -mt-0.5"
                                />
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
