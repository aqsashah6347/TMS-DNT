import { useEffect, useState } from "react";
import { Briefcase, Users as UsersIcon, Hash, UserCog } from "lucide-react";
import Card from "../../../components/ui/Card";
import Avatar from "../../../components/ui/Avatar";
import { useAuthStore } from "../../../store/useAuthStore";
import { usersApi } from "../../../api/usersApi";
import { employeesApi } from "../../../api/employeesApi";
import { teamApi } from "../../../api/teamApi";
import { taskApi } from "../../../api/taskApi";

function StatBox({ label, value, tone = "default" }) {
  const toneClass =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-red-400"
        : "text-white";
  return (
    <div className="glass rounded-2xl px-4 py-3 flex flex-col gap-1 min-w-[130px]">
      <span className="text-[11px] uppercase tracking-wide text-white/50">
        {label}
      </span>
      <span className={`text-2xl font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-white/60" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-white/40 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm text-white truncate">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default function ProfileInfoTab() {
  const user = useAuthStore((s) => s.user);
  const [department, setDepartment] = useState(null);
  const [employeeNo, setEmployeeNo] = useState(null);
  const [team, setTeam] = useState(null);
  const [taskStats, setTaskStats] = useState({
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [usersRes, directoryRes, teamRes, tasksRes] =
        await Promise.allSettled([
          usersApi.getAllUsers(),
          employeesApi.getDirectory(),
          teamApi.getMyTeam(),
          taskApi.getAllTasks({ assignedTo: user.id }, 1, 1000),
        ]);

      if (cancelled) return;

      if (usersRes.status === "fulfilled") {
        const me = usersRes.value.find((u) => u.id === user.id);
        setEmployeeNo(me?.enroll_no || null);
      }

      if (directoryRes.status === "fulfilled") {
        const entry = directoryRes.value.employees?.find(
          (e) => e.userId === user.id,
        );
        setDepartment(entry?.department || null);
      }

      if (teamRes.status === "fulfilled") {
        setTeam(teamRes.value.team || null);
      }

      if (tasksRes.status === "fulfilled") {
        const tasks = tasksRes.value.tasks || [];
        const today = new Date().toISOString().split("T")[0];
        const completed = tasks.filter((t) => t.status === "done").length;
        const failed = tasks.filter(
          (t) => t.dueDate && t.dueDate < today && t.status !== "done",
        ).length;
        setTaskStats({ completed, failed, total: tasks.length });
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar
            name={user?.name}
            color={user?.avatarColor}
            size={72}
            className="text-2xl"
          />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {user?.name}
            </h3>
            <p className="text-xs text-white/50">{user?.email}</p>
            <span
              className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                user?.status === "active"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {user?.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </Card>

      <Card className="w-full max-w-3xl mx-auto">
        <h3 className="text-sm font-semibold text-white mb-1">Details</h3>
        <div className="flex flex-col">
          <InfoRow icon={Hash} label="Employee No" value={employeeNo} />
          <InfoRow icon={Briefcase} label="Department" value={department} />
          <InfoRow icon={UsersIcon} label="Team" value={team?.name} />
          <InfoRow icon={UserCog} label="Manager" value={team?.managerName} />
          <InfoRow icon={UserCog} label="Role" value={user?.role} />
        </div>
      </Card>

      <Card className="w-full max-w-3xl mx-auto">
        <h3 className="text-sm font-semibold text-white mb-3">
          Task Performance
        </h3>
        <div className="flex flex-wrap gap-3">
          <StatBox
            label="Completed"
            value={loading ? "—" : taskStats.completed}
            tone="good"
          />
          <StatBox
            label="Failed / Missed"
            value={loading ? "—" : taskStats.failed}
            tone="bad"
          />
          <StatBox
            label="Total Assigned"
            value={loading ? "—" : taskStats.total}
          />
        </div>
      </Card>
    </div>
  );
}
