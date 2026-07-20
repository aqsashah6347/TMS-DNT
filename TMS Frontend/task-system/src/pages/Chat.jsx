import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  UserPlus,
  Search,
  X,
  SlidersHorizontal,
  Users,
  MessageSquare,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../Features/chat/chatStore";
import { chatApi } from "../api/chatApi";
import { connectSocket, getSocket } from "../lib/socket";
import MessageBubble from "../components/chat/MessageBubble";
import ChatInput from "../components/chat/ChatInput";

const TABS = [
  { key: "chats", label: "Chats" },
  { key: "team", label: "Team Chat" },
  { key: "new", label: "New Chat" },
];

const CHAT_FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "online", label: "Online" },
  { key: "archived", label: "Archived" },
];

const TEAM_FILTERS = [
  { key: "all", label: "All teams" },
  { key: "unread", label: "Unread" },
];

const ROLE_FILTERS = [
  { key: "all", label: "Everyone" },
  { key: "admin", label: "Admins" },
  { key: "manager", label: "Managers" },
  { key: "user", label: "Users" },
];

// Stable fallback so "no one is typing in this team" doesn't hand a
// brand-new Set() to useMemo's deps every render — that made the
// teamTypingNames memo pointless (it recomputed on every render).
const EMPTY_TYPING_SET = new Set();

function Avatar({ name, size = 32, online }) {
  return (
    <div className="relative shrink-0">
      <div
        className="rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center font-semibold text-white"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1c1c1c]" />
      )}
    </div>
  );
}

function TeamAvatar({ name, color, size = 32 }) {
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: color || "linear-gradient(135deg,#f97316,#7c2d12)",
      }}
    >
      <Users size={size * 0.5} />
    </div>
  );
}

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
    error,
    fetchConversations,
    fetchAvailableEmployees,
    openConversation,
    startConversation,
    sendMessage,
    initSocketListeners,
    archiveConversation,
    deleteConversation,

    teams,
    teamMessagesByTeam,
    activeTeamId,
    teamTypingByTeam,
    fetchTeams,
    openTeamConversation,
    sendTeamMessage,
  } = useChatStore();

  // Lets other pages (e.g. the Profile page's "View archived" button)
  // jump straight into the Archived filter via navigate("/chat", { state: { filter: "archived" } }).
  const location = useLocation();
  const [tab, setTab] = useState("chats");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [chatFilter, setChatFilter] = useState(location.state?.filter || "all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [allUsers, setAllUsers] = useState([]);
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const scrollRef = useRef(null);
  const dropdownRef = useRef(null);
  const filterRef = useRef(null);
  const headerMenuRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!getSocket()) connectSocket();
    initSocketListeners();
    fetchConversations();
    fetchAvailableEmployees();
    fetchTeams();
    chatApi
      .getAllUsers()
      .then(setAllUsers)
      .catch(() => {});

    // Conversations/teams carry unread counts and last-message previews
    // that can change from other people's activity, not just sockets
    // reaching this tab — a light poll keeps both lists fresh.
    const interval = setInterval(() => {
      fetchConversations();
      fetchTeams();
    }, 15000);
    return () => clearInterval(interval);
    // fetchConversations/fetchAvailableEmployees/fetchTeams/initSocketListeners
    // come from the zustand store and keep a stable reference for the life
    // of the store, so it's safe to list them without turning this into a
    // repeating effect.
  }, [
    fetchAvailableEmployees,
    fetchConversations,
    fetchTeams,
    initSocketListeners,
  ]);

  // Pulled out of the effect below so the dependency array only holds
  // plain variables — a computed member expression there can't be
  // statically checked by the linter.
  const activeMessages = messagesByUser[activeUserId] || [];
  const activeTeamMessages = teamMessagesByTeam[activeTeamId] || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeMessages, activeTeamMessages]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!filterOpen) return;
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  useEffect(() => {
    if (!headerMenuOpen) return;
    const handleClickOutside = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target))
        setHeaderMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [headerMenuOpen]);

  // Tab switch also resets the filter + search so "Unread" from Chats
  // doesn't silently carry over and confuse the Team Chat list.
  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    setSearch("");
    setFilterOpen(false);
  };

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

  const visibleChatUsers = sortedUsers
    .filter((u) => u.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((u) => {
      const isArchived = !!conversationMap.get(u.id)?.archived;
      if (chatFilter === "archived") return isArchived;
      if (isArchived) return false; // archived chats stay out of every other view
      if (chatFilter === "unread")
        return (conversationMap.get(u.id)?.unreadCount || 0) > 0;
      if (chatFilter === "online") return onlineUserIds.has(u.id);
      return true;
    });

  const sortedTeams = [...teams].sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt)
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.name.localeCompare(b.name);
  });

  const visibleTeams = sortedTeams
    .filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((t) => (teamFilter === "unread" ? t.unreadCount > 0 : true));

  const activeUser = otherUsers.find((u) => u.id === activeUserId);
  const lastMineId = [...activeMessages]
    .reverse()
    .find((m) => m.sender_id === currentUser?.id)?.id;

  const activeTeam = teams.find((t) => t.id === activeTeamId);
  const teamTypingUsers = teamTypingByTeam[activeTeamId] || EMPTY_TYPING_SET;
  const teamTypingNames = useMemo(() => {
    if (!activeTeam) return [];
    return activeTeam.members
      .filter((m) => teamTypingUsers.has(m.id) && m.id !== currentUser?.id)
      .map((m) => m.name);
  }, [activeTeam, teamTypingUsers, currentUser?.id]);

  const filteredEmployees = allEmployees
    .filter((e) => e.id !== currentUser?.id)
    .filter((e) =>
      e.name.toLowerCase().includes(employeeSearch.trim().toLowerCase()),
    );

  const directoryUsers = allEmployees
    .filter((e) => e.id !== currentUser?.id)
    .filter((e) => e.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((e) => (roleFilter === "all" ? true : e.role === roleFilter));

  const handleSend = async () => {
    if ((!draft.trim() && !pendingFile) || !activeUserId) return;
    const ok = await sendMessage(activeUserId, draft, pendingFile);
    if (ok) {
      setDraft("");
      setPendingFile(null);
    }
    getSocket()?.emit("stop_typing", { receiverId: activeUserId });
  };

  const handleSendTeam = async () => {
    if ((!draft.trim() && !pendingFile) || !activeTeamId) return;
    const ok = await sendTeamMessage(activeTeamId, draft, pendingFile);
    if (ok) {
      setDraft("");
      setPendingFile(null);
    }
    getSocket()?.emit("team_stop_typing", { teamId: activeTeamId });
  };

  const handleTyping = (value) => {
    setDraft(value);
    const socket = getSocket();
    if (tab === "team" && activeTeamId) {
      socket?.emit("team_typing", { teamId: activeTeamId });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket?.emit("team_stop_typing", { teamId: activeTeamId });
      }, 1500);
      return;
    }
    if (!activeUserId) return;
    socket?.emit("typing", { receiverId: activeUserId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit("stop_typing", { receiverId: activeUserId });
    }, 1500);
  };

  const activeConvo = activeUserId ? conversationMap.get(activeUserId) : null;

  const handleToggleArchive = async () => {
    if (!activeUserId) return;
    setHeaderMenuOpen(false);
    await archiveConversation(activeUserId, !activeConvo?.archived);
  };

  const handleDeleteChat = async () => {
    if (!activeUserId) return;
    setHeaderMenuOpen(false);
    const confirmed = window.confirm(
      `Delete your chat with ${activeUser?.name}? This clears it from your side only — it won't delete it for them.`,
    );
    if (!confirmed) return;
    await deleteConversation(activeUserId);
  };

  const handlePickEmployee = (employee) => {
    setHeaderMenuOpen(false);
    startConversation(employee.id);
    setDropdownOpen(false);
    setEmployeeSearch("");
  };

  const handleStartFromDirectory = (employee) => {
    setHeaderMenuOpen(false);
    startConversation(employee.id);
    setTab("chats");
    setSearch("");
    setFilterOpen(false);
    setDraft("");
    setPendingFile(null);
  };

  const isTeamMode = tab === "team";
  // Whichever conversation is open should keep showing on the right even
  // if the person switches back to the "Chats" tab list, so picking a
  // team then tapping "Chats" doesn't blank the panel unexpectedly.
  const showingTeamPanel = activeTeamId && (isTeamMode || !activeUserId);

  return (
    <div>
      <h2
        className="text-3xl text-white mb-6"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
      >
        Messages
      </h2>

      <div className="flex h-[75vh] rounded-[24px] overflow-hidden border border-white/10 bg-[#161616] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="w-[380px] shrink-0 flex flex-col border-r border-white/10 bg-[#1c1c1c]">
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex items-center gap-1 px-3 pt-3 border-b border-white/10 pb-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={`flex-1 text-sm font-medium rounded-lg px-2 py-2 transition-colors ${
                    tab === t.key
                      ? "bg-orange-500 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search + filter (Chats / Team Chat / New Chat) */}
            <div
              className="relative px-3 pt-3 pb-2 border-b border-white/10 flex items-center gap-2"
              ref={filterRef}
            >
              <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 bg-[#2a2a2a]">
                <Search size={15} className="text-white/30 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    tab === "chats"
                      ? "Search chats..."
                      : tab === "team"
                        ? "Search teams..."
                        : "Search people..."
                  }
                  className="flex-1 bg-transparent text-[15px] text-white placeholder-white/30 outline-none min-w-0"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-white/30 hover:text-white shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setFilterOpen((p) => !p)}
                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                  filterOpen ||
                  chatFilter !== "all" ||
                  teamFilter !== "all" ||
                  roleFilter !== "all"
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                <SlidersHorizontal size={15} />
              </button>

              {filterOpen && (
                <div className="absolute right-3 top-[calc(100%-4px)] z-30 w-44 rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden p-1.5">
                  {(tab === "chats"
                    ? CHAT_FILTERS
                    : tab === "team"
                      ? TEAM_FILTERS
                      : ROLE_FILTERS
                  ).map((f) => {
                    const active =
                      tab === "chats"
                        ? chatFilter === f.key
                        : tab === "team"
                          ? teamFilter === f.key
                          : roleFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => {
                          if (tab === "chats") setChatFilter(f.key);
                          else if (tab === "team") setTeamFilter(f.key);
                          else setRoleFilter(f.key);
                          setFilterOpen(false);
                        }}
                        className={`w-full text-left text-sm rounded-xl px-3 py-2 transition-colors ${
                          active
                            ? "bg-orange-500/15 text-orange-400"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chats tab: New chat launcher */}
            {tab === "chats" && (
              <div className="relative px-3 pt-2 pb-1" ref={dropdownRef}>
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
                            <Avatar name={emp.name} size={28} />
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
            )}

            {/* List body */}
            <div className="flex-1 overflow-y-auto p-2">
              {tab === "chats" &&
                (visibleChatUsers.length === 0 ? (
                  <div className="py-10 text-center text-xs text-white/30 px-4">
                    {sortedUsers.length === 0
                      ? 'No active chats yet — use "New chat" to find someone.'
                      : "No chats match your search or filter."}
                  </div>
                ) : (
                  visibleChatUsers.map((u) => {
                    const convo = conversationMap.get(u.id);
                    const isOnline = onlineUserIds.has(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setHeaderMenuOpen(false);
                          openConversation(u.id);
                        }}
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                          activeUserId === u.id
                            ? "bg-orange-500 text-white"
                            : "hover:bg-white/[0.06]"
                        }`}
                      >
                        <Avatar name={u.name} size={40} online={isOnline} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[15px] font-medium text-white truncate">
                              {u.name}
                            </span>
                            {convo?.unreadCount > 0 && (
                              <span className="shrink-0 text-[11px] font-semibold bg-red-500 text-white rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                                {convo.unreadCount > 9
                                  ? "9+"
                                  : convo.unreadCount}
                              </span>
                            )}
                          </div>
                          {(convo?.lastMessage ||
                            convo?.lastAttachmentName) && (
                            <p
                              className={`text-sm truncate ${
                                activeUserId === u.id
                                  ? "text-white/80"
                                  : "text-white/45"
                              }`}
                            >
                              {convo.lastMessage ||
                                `📎 ${convo.lastAttachmentName}`}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                ))}

              {tab === "team" &&
                (visibleTeams.length === 0 ? (
                  <div className="py-10 text-center text-xs text-white/30 px-4">
                    {teams.length === 0
                      ? "You're not assigned to any team chat yet."
                      : "No teams match your search or filter."}
                  </div>
                ) : (
                  visibleTeams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        openTeamConversation(t.id);
                      }}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                        activeTeamId === t.id
                          ? "bg-orange-500 text-white"
                          : "hover:bg-white/[0.06]"
                      }`}
                    >
                      <TeamAvatar name={t.name} color={t.color} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[15px] font-medium text-white truncate">
                            {t.name}
                          </span>
                          {t.unreadCount > 0 && (
                            <span className="shrink-0 text-[11px] font-semibold bg-red-500 text-white rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                              {t.unreadCount > 9 ? "9+" : t.unreadCount}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm truncate ${
                            activeTeamId === t.id
                              ? "text-white/80"
                              : "text-white/45"
                          }`}
                        >
                          {t.lastMessage || t.lastAttachmentName
                            ? `${
                                t.lastMessageSenderName
                                  ? t.lastMessageSenderName + ": "
                                  : ""
                              }${t.lastMessage || `📎 ${t.lastAttachmentName}`}`
                            : `${t.memberCount} member${t.memberCount === 1 ? "" : "s"}`}
                        </p>
                      </div>
                    </button>
                  ))
                ))}

              {tab === "new" &&
                (directoryUsers.length === 0 ? (
                  <div className="py-10 text-center text-xs text-white/30 px-4">
                    No one matches your search or filter.
                  </div>
                ) : (
                  directoryUsers.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleStartFromDirectory(emp)}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                    >
                      <Avatar name={emp.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white truncate block">
                          {emp.name}
                        </span>
                        <span className="text-xs text-white/40 capitalize">
                          {emp.role}
                        </span>
                      </div>
                      <MessageSquare size={15} className="text-white/30" />
                    </button>
                  ))
                ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-[#161616]">
          <div className="flex flex-col h-full">
            {showingTeamPanel ? (
              <>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                  <TeamAvatar
                    name={activeTeam?.name}
                    color={activeTeam?.color}
                    size={40}
                  />
                  <div className="min-w-0">
                    <div className="text-base font-medium text-white truncate">
                      {activeTeam?.name}
                    </div>
                    <div className="text-sm text-white/40 truncate">
                      {activeTeam?.memberCount} member
                      {activeTeam?.memberCount === 1 ? "" : "s"}
                      {teamTypingNames.length > 0 &&
                        ` · ${teamTypingNames.join(", ")} typing...`}
                    </div>
                  </div>
                  <div className="ml-auto flex -space-x-2">
                    {activeTeam?.members?.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        title={m.name}
                        className="w-8 h-8 rounded-full border-2 border-[#161616] bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-xs font-semibold text-white"
                      >
                        {m.name.charAt(0)}
                      </div>
                    ))}
                    {activeTeam?.members?.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#161616] bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                        +{activeTeam.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-[#141414]"
                >
                  {activeTeamMessages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-white/30 text-base">
                      No messages yet — say hello to {activeTeam?.name}.
                    </div>
                  ) : (
                    activeTeamMessages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        message={m}
                        mine={m.sender_id === currentUser?.id}
                        showSeen={false}
                        senderName={m.sender_name}
                      />
                    ))
                  )}
                </div>

                {error && (
                  <div className="px-4 pt-2 text-xs text-red-400">{error}</div>
                )}

                <ChatInput
                  draft={draft}
                  onDraftChange={handleTyping}
                  onSend={handleSendTeam}
                />
              </>
            ) : !activeUser ? (
              <div className="flex-1 flex items-center justify-center text-white/40 text-base bg-[#141414]">
                {tab === "team"
                  ? "Pick a team to start chatting"
                  : "Pick someone to start chatting"}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                  <Avatar
                    name={activeUser.name}
                    size={40}
                    online={onlineUserIds.has(activeUser.id)}
                  />
                  <div className="min-w-0">
                    <div className="text-base font-medium text-white truncate">
                      {activeUser.name}
                    </div>
                    <div className="text-sm text-white/40 truncate">
                      {typingUserIds.has(activeUser.id)
                        ? "typing..."
                        : onlineUserIds.has(activeUser.id)
                          ? "Online"
                          : "Offline"}
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-1">
                    <div className="relative" ref={headerMenuRef}>
                      <button
                        onClick={() => setHeaderMenuOpen((p) => !p)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          headerMenuOpen
                            ? "bg-orange-500/20 text-orange-400"
                            : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {headerMenuOpen && (
                        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-52 rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden p-1.5">
                          <button
                            onClick={handleToggleArchive}
                            className="w-full flex items-center gap-2.5 text-left text-sm rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            {activeConvo?.archived ? (
                              <ArchiveRestore size={16} />
                            ) : (
                              <Archive size={16} />
                            )}
                            {activeConvo?.archived
                              ? "Unarchive chat"
                              : "Archive chat"}
                          </button>
                          <button
                            onClick={handleDeleteChat}
                            className="w-full flex items-center gap-2.5 text-left text-sm rounded-xl px-3 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete chat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-[#141414]"
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

                {error && (
                  <div className="px-5 pt-2 text-sm text-red-400">{error}</div>
                )}

                <ChatInput
                  draft={draft}
                  onDraftChange={handleTyping}
                  onSend={handleSend}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
