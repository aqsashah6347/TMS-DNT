import { Search, MoreVertical, MessageSquarePlus } from "lucide-react";
import { useChatStore } from "../chatStore";
import ThreadListItem from "./ThreadListItem";

export default function ThreadSidebar() {
  const { threads, activeThreadId, selectThread, search, setSearch } =
    useChatStore();

  const filtered = threads.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-full md:w-[25%] md:min-w-[280px] md:max-w-[360px] h-full flex flex-col bg-[#161616] border-r border-white/[0.06]">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-orange-400 flex items-center justify-center text-[#18181b] font-bold text-sm">
            AQ
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              Aqsa
            </p>
            <p className="text-[11px] text-emerald-400 leading-tight">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
            <MessageSquarePlus size={18} />
          </button>
          <button className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 bg-white/[0.05] rounded-full px-3.5 py-2">
          <Search size={15} className="text-white/40 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or start a new chat"
            className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/35 w-full"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-white/40 py-10">
            No conversations found
          </p>
        ) : (
          filtered.map((thread) => (
            <ThreadListItem
              key={thread.id}
              thread={thread}
              active={thread.id === activeThreadId}
              onClick={() => selectThread(thread.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
