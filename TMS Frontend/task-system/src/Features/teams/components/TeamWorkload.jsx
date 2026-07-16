import { useMemo } from "react";
import Avatar from "../../../components/ui/Avatar";
import { useTaskStore } from "../../tasks/taskStore";

// Real per-member workload — counts each member's not-yet-done tasks.
// Reads from the shared taskStore, which Teams.jsx fetches on mount, so
// this works even if the Tasks page hasn't been visited yet this session.
export default function TeamWorkload({ team, max = 3 }) {
  const tasks = useTaskStore((s) => s.tasks);

  const memberDetails = team.memberDetails?.length
    ? team.memberDetails
    : (team.members || []).map((name) => ({ id: null, name }));

  const counts = useMemo(() => {
    return memberDetails.map((member) => {
      const openTasks = member.id
        ? tasks.filter((t) => t.assignedTo === member.id && t.status !== "done")
        : [];
      return { ...member, count: openTasks.length };
    });
  }, [memberDetails, tasks]);

  if (counts.length === 0) {
    return <p className="text-xs text-white/30 italic">No members yet.</p>;
  }

  const maxLoad = Math.max(...counts.map((m) => m.count), 1);
  const shown = counts.slice(0, max);
  const overflow = counts.length - shown.length;

  return (
    <div className="flex flex-col gap-2">
      {shown.map((member) => (
        <div
          key={member.id ?? member.name}
          className="flex items-center gap-2.5"
        >
          <Avatar
            name={member.name}
            color={member.avatarColor}
            size={22}
            className="text-[10px]"
          />
          <span className="text-xs text-white/80 w-20 truncate shrink-0">
            {member.name}
          </span>
          <div className="progress-track flex-1">
            <div
              className="progress-fill"
              style={{ width: `${(member.count / maxLoad) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-white/40 shrink-0 w-14 text-right">
            {member.count} task{member.count === 1 ? "" : "s"}
          </span>
        </div>
      ))}
      {overflow > 0 && (
        <p className="text-[11px] text-white/30 pl-[30px]">+{overflow} more</p>
      )}
    </div>
  );
}
