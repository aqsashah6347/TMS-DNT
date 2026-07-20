import Avatar from "../../../components/ui/Avatar";

// Small reusable avatar stack — used inside ProjectCard and TeamCard alike.
// Accepts `members` as either plain name strings (legacy) or full objects
// ({ id, name, avatarColor }) — pass memberDetails when you have it so each
// person's chosen color shows up here too.
export default function ProjectMembers({ members = [], max = 4 }) {
  const shown = members.slice(0, max);
  const overflow = members.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((member, i) => {
        const isObject = typeof member === "object" && member !== null;
        const name = isObject ? member.name : member;
        const color = isObject ? member.avatarColor : null;
        const key = isObject ? (member.id ?? i) : i;

        return (
          <Avatar
            key={key}
            name={name}
            color={color}
            size={28}
            className="border-2 border-surface text-[11px]"
          />
        );
      })}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-muted text-white text-[10px] font-semibold flex items-center justify-center border-2 border-surface">
          +{overflow}
        </div>
      )}
    </div>
  );
}
