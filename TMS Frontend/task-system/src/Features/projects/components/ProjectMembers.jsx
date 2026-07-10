// Small reusable avatar stack — used inside ProjectCard and TeamCard alike.
export default function ProjectMembers({ members = [], max = 4 }) {
  const shown = members.slice(0, max);
  const overflow = members.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((name, i) => (
        <div
          key={i}
          className="w-7 h-7 rounded-full bg-primary-light text-dark text-[11px] font-semibold flex items-center justify-center border-2 border-surface"
          title={name}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-muted text-white text-[10px] font-semibold flex items-center justify-center border-2 border-surface">
          +{overflow}
        </div>
      )}
    </div>
  );
}
