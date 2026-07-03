// Mini horizontal bar per member showing task load — placeholder counts for now.
// Later: derive real counts from taskStore by filtering tasks where assignedTo === member.
const placeholderWorkload = { Aqsa: 5, Sara: 3, Ali: 7, Zara: 2, Hina: 4 };

export default function TeamWorkload({ members }) {
  const maxLoad = Math.max(
    ...members.map((m) => placeholderWorkload[m] || 1),
    1,
  );

  return (
    <div className="flex flex-col gap-2">
      {members.map((name) => {
        const load = placeholderWorkload[name] || 0;
        return (
          <div key={name} className="flex items-center gap-2">
            <span className="text-xs text-dark w-16 truncate">{name}</span>
            <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(load / maxLoad) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-muted w-6 text-right">
              {load}
            </span>
          </div>
        );
      })}
    </div>
  );
}
