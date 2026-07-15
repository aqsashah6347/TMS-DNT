import { useEffect, useRef, useState } from "react";
import { UserPlus, Search, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../Features/chat/chatStore";
import { chatApi } from "../api/chatApi";
import { connectSocket, getSocket } from "../lib/socket";
import MessageBubble from "../components/chat/MessageBubble";
import ChatInput from "../components/chat/ChatInput";

export default function Chat() {
  const currentUser = useAuthStore((s) => s.user);
  const {
    conversations,
    messagesByUser,
    activeUserId,
    onlineUserIds,
    typingUserIds,
    pinnedUserIds,
    allEmployees,
    fetchConversations,
    fetchAvailableEmployees,
    openConversation,
    startConversation,
    sendMessage,
    initSocketListeners,
  } = useChatStore();

  const [allUsers, setAllUsers] = useState([]);
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const scrollRef = useRef(null);
  const dropdownRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!getSocket()) connectSocket();
    initSocketListeners();
    fetchConversations();
    fetchAvailableEmployees();
    chatApi
      .getAllUsers()
      .then(setAllUsers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messagesByUser[activeUserId]]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const otherUsers = allUsers.filter((u) => u.id !== currentUser?.id);
  const conversationMap = new Map(conversations.map((c) => [c.userId, c]));

  const activeChatUsers = otherUsers.filter(
    (u) => conversationMap.has(u.id) || pinnedUserIds.has(u.id),
  );

  const sortedUsers = [...activeChatUsers].sort((a, b) => {
    const ca = conversationMap.get(a.id)?.lastMessageAt;
    const cb = conversationMap.get(b.id)?.lastMessageAt;
    if (ca && cb) return new Date(cb) - new Date(ca);
    if (ca) return -1;
    if (cb) return 1;
    return a.name.localeCompare(b.name);
  });

  const activeUser = otherUsers.find((u) => u.id === activeUserId);
  const activeMessages = messagesByUser[activeUserId] || [];
  const lastMineId = [...activeMessages]
    .reverse()
    .find((m) => m.sender_id === currentUser?.id)?.id;

  const filteredEmployees = allEmployees
    .filter((e) => e.id !== currentUser?.id)
    .filter((e) =>
      e.name.toLowerCase().includes(employeeSearch.trim().toLowerCase()),
    );

  const handleSend = () => {
    if ((!draft.trim() && !pendingFile) || !activeUserId) return;
    sendMessage(activeUserId, draft, pendingFile);
    setDraft("");
    setPendingFile(null);
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

  const handlePickEmployee = (employee) => {
    startConversation(employee.id);
    setDropdownOpen(false);
    setEmployeeSearch("");
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
        <div className="glass glass-card overflow-visible flex flex-col">
          <div className="glass-content flex flex-col h-full">
            <div
              className="relative px-3 pt-3 pb-2 border-b border-white/10"
              ref={dropdownRef}
            >
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
              >
                <UserPlus size={15} />
                New chat
              </button>

              {dropdownOpen && (
                <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-30 rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
                    <Search size={14} className="text-white/30 shrink-0" />
                    <input
                      autoFocus
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      placeholder="Search employees..."
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                    />
                    {employeeSearch && (
                      <button
                        onClick={() => setEmployeeSearch("")}
                        className="text-white/30 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto p-1.5">
                    {filteredEmployees.length === 0 ? (
                      <div className="py-6 text-center text-xs text-white/30">
                        No employees found
                      </div>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => handlePickEmployee(emp)}
                          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-orange-500/15 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="text-sm text-white truncate">
                            {emp.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {sortedUsers.length === 0 ? (
                <div className="py-10 text-center text-xs text-white/30 px-4">
                  No active chats yet — use "New chat" to find someone.
                </div>
              ) : (
                sortedUsers.map((u) => {
                  const convo = conversationMap.get(u.id);
                  const isOnline = onlineUserIds.has(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => openConversation(u.id)}
                      className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        activeUserId === u.id
                          ? "bg-orange-500/15"
                          : "hover:bg-white/5"
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
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-white truncate">
                            {u.name}
                          </span>
                          {convo?.unreadCount > 0 && (
                            <span className="shrink-0 text-[10px] font-semibold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                              {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
                            </span>
                          )}
                        </div>
                        {(convo?.lastMessage || convo?.lastAttachmentName) && (
                          <p className="text-xs text-white/40 truncate">
                            {convo.lastMessage ||
                              `📎 ${convo.lastAttachmentName}`}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
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
                  <span className="text-sm font-medium text-white">
                    {activeUser.name}
                  </span>
                  {onlineUserIds.has(activeUser.id) && (
                    <span className="text-[10px] text-emerald-400">online</span>
                  )}
                  {typingUserIds.has(activeUser.id) && (
                    <span className="text-[10px] text-white/40 ml-2">
                      typing...
                    </span>
                  )}
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2"
                >
                  {activeMessages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      mine={m.sender_id === currentUser?.id}
                      showSeen={m.id === lastMineId}
                    />
                  ))}
                </div>

                <ChatInput
                  draft={draft}
                  onDraftChange={handleTyping}
                  onSend={handleSend}
                  onFileSelect={setPendingFile}
                  pendingFile={pendingFile}
                  onClearFile={() => setPendingFile(null)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
