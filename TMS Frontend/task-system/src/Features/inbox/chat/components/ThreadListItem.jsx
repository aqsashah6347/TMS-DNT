export default function ThreadListItem({ thread, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-white/[0.04] ${
        active ? "bg-orange-400/10" : "hover:bg-white/[0.04]"
      }`}
    >
      <div className="relative shrink-0">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-[#18181b]"
          style={{ backgroundColor: thread.avatarColor }}
        >
          {thread.avatarText}
        </div>
        {thread.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#161616]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white truncate">
            {thread.name}
          </p>
          <span className="text-[11px] text-white/40 shrink-0">
            {thread.time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-white/50 truncate">{thread.lastMessage}</p>
          {thread.unread > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-400 text-[#18181b] text-[10px] font-bold flex items-center justify-center">
              {thread.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
