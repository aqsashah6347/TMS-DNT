import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../Features/chat/chatStore";
import { chatApi } from "../api/chatApi";
import { connectSocket, getSocket } from "../lib/socket";

export default function Chat() {
  const currentUser = useAuthStore((s) => s.user);
  const {
    conversations,
    messagesByUser,
    activeUserId,
    onlineUserIds,
    typingUserIds,
    fetchConversations,
    openConversation,
    sendMessage,
    initSocketListeners,
  } = useChatStore();

  const [allUsers, setAllUsers] = useState([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!getSocket()) connectSocket();
    initSocketListeners();
    fetchConversations();
    chatApi.getAllUsers().then(setAllUsers).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messagesByUser[activeUserId]]);

  const otherUsers = allUsers.filter((u) => u.id !== currentUser?.id);
  const conversationMap = new Map(conversations.map((c) => [c.userId, c]));

  const sortedUsers = [...otherUsers].sort((a, b) => {
    const ca = conversationMap.get(a.id)?.lastMessageAt;
    const cb = conversationMap.get(b.id)?.lastMessageAt;
    if (ca && cb) return new Date(cb) - new Date(ca);
    if (ca) return -1;
    if (cb) return 1;
    return a.name.localeCompare(b.name);
  });

  const activeUser = otherUsers.find((u) => u.id === activeUserId);
  const activeMessages = messagesByUser[activeUserId] || [];

  const handleSend = () => {
    if (!draft.trim() || !activeUserId) return;
    sendMessage(activeUserId, draft);
    setDraft("");
    getSocket()?.emit("stop_typing", { receiverId: activeUserId });
  };

  const handleTyping = (value) => {
    setDraft(value);
    if (!activeUserId) return;
    const socket = getSocket();
    socket?.emit("typing", { receiverId: activeUserId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit("stop_typing", { receiverId: activeUserId });
    }, 1500);
  };

  return (
    <div>
      <h2
        className="text-2xl text-white mb-6"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
      >
        Chat
      </h2>

      <div className="grid grid-cols-3 gap-4 h-[70vh]">
        <div className="glass glass-card overflow-y-auto">
          <div className="glass-content p-2">
            {sortedUsers.map((u) => {
              const convo = conversationMap.get(u.id);
              const isOnline = onlineUserIds.has(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => openConversation(u.id)}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    activeUserId === u.id ? "bg-orange-500/15" : "hover:bg-white/5"
                  }`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-xs font-semibold text-white">
                      {u.name.charAt(0)}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#141414]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white truncate">{u.name}</span>
                      {convo?.unreadCount > 0 && (
                        <span className="text-[10px] bg-orange-500 text-white rounded-full px-1.5 py-0.5">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    {convo?.lastMessage && (
                      <p className="text-xs text-white/40 truncate">{convo.lastMessage}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-2 glass glass-card flex flex-col">
          <div className="glass-content flex flex-col h-full">
            {!activeUser ? (
              <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
                Pick someone to start chatting
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-xs font-semibold text-white">
                    {activeUser.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-white">{activeUser.name}</span>
                  {onlineUserIds.has(activeUser.id) && (
                    <span className="text-[10px] text-emerald-400">online</span>
                  )}
                  {typingUserIds.has(activeUser.id) && (
                    <span className="text-[10px] text-white/40 ml-2">typing...</span>
                  )}
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
                  {activeMessages.map((m) => {
                    const mine = m.sender_id === currentUser?.id;
                    return (
                      <div
                        key={m.id}
                        className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? "self-end bg-orange-500/20 text-white"
                            : "self-start bg-white/10 text-white"
                        }`}
                      >
                        {m.message}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
                  <input
                    value={draft}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:bg-white/10"
                  />
                  <button
                    onClick={handleSend}
                    className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}