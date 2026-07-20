import { useMemo } from "react";
import Avatar from "../../../components/ui/Avatar";
import { useProjectStore } from "../../projects/projectStore";
import { DEFAULT_TEAM_COLOR } from "../../../utils/teamColors";

const statusBadge = {
  planning: "glass-badge--violet",
  active: "glass-badge--amber",
  completed: "glass-badge--primary",
};

const MAX_VISIBLE_PROJECTS = 4;

export default function TeamCard({ team, onClick }) {
  const allProjects = useProjectStore((s) => s.projects);
  const teamProjects = useMemo(
    () => allProjects.filter((p) => p.teamId === team.id),
    [allProjects, team.id],
  );

  const color = team.color || DEFAULT_TEAM_COLOR;
  const members = team.memberDetails || [];
  const manager = members.find((m) => m.id === team.managerId);
  const visibleProjects = teamProjects.slice(0, MAX_VISIBLE_PROJECTS);
  const extraProjectCount = teamProjects.length - visibleProjects.length;

  return (
    <div
      className={`team-card ${onClick ? "team-card--clickable" : ""}`}
      onClick={() => onClick?.(team)}
      style={{ "--clr": color }}
    >
      <div className="team-card__inner">
        {/* "image" area — glass-tinted panel listing every team member + employee no. */}
        <div className="team-card__members">
          <div className="team-card__members-scroll">
            {members.length === 0 ? (
              <p className="team-card__members-empty">No members yet</p>
            ) : (
              members.map((m) => (
                <div key={m.id} className="team-card__member-row">
                  <span className="team-card__member-name">{m.name}</span>
                  {m.enrollNo && (
                    <span className="team-card__member-enroll">
                      #{m.enrollNo}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* manager badge, sits inside the card bounds */}
        <div className="team-card__icon">
          <Avatar
            name={manager?.name || team.managerName}
            color={manager?.avatarColor}
            size={40}
          />
        </div>
      </div>

      <div className="team-card__content">
        <h3 className="team-card__title">{team.name}</h3>

        <div className="team-card__manager-row">
          <span className="team-card__label">Manager</span>
          <span className="team-card__manager-name">
            {team.managerName || "Unassigned"}
          </span>
        </div>

        <p className="team-card__label mt-1">Active Projects</p>
        <ul className="team-card__tags">
          {visibleProjects.length === 0 ? (
            <li className="team-card__tag team-card__tag--empty">
              No projects yet
            </li>
          ) : (
            <>
              {visibleProjects.map((p) => (
                <li
                  key={p.id}
                  className={`glass-badge ${statusBadge[p.status]} team-card__tag`}
                >
                  {p.name}
                </li>
              ))}
              {extraProjectCount > 0 && (
                <li className="team-card__tag team-card__tag--more">
                  +{extraProjectCount} more
                </li>
              )}
            </>
          )}
        </ul>

        {team.createdByName && (
          <p className="team-card__made-by">Made by {team.createdByName}</p>
        )}
      </div>
    </div>
  );
}
