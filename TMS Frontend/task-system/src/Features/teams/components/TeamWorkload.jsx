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
            <span className="text-xs text-white/70 w-16 truncate">{name}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${(load / maxLoad) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-white/40 w-6 text-right">
              {load}
            </span>
          </div>
        );
      })}
    </div>
  );
}
