import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../../chat/chatStore";
import { formatIOSTime } from "../../../lib/dateFormat";

// Left column of the Dashboard's Activity box. Pulls real conversations
// from /chat/conversations (see chatStore.fetchConversations) and only
// surfaces the ones with something unread — those are the ones that
// actually "texted you" and are waiting on a reply.
export default function ChatNotifications() {
  const { conversations, fetchConversations, openConversation } =
    useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const unread = conversations.filter((c) => c.unreadCount > 0).slice(0, 4);

  function handleClick(c) {
    openConversation(c.userId);
    navigate("/chat");
  }

  if (unread.length === 0) {
    return <p className="text-sm text-white/40">No new messages</p>;
  }

  return (
    <div className="flex flex-col">
      {unread.map((c) => (
        <button
          key={c.userId}
          onClick={() => handleClick(c)}
          className="inbox-row"
        >
          <span
            className="inbox-row__icon"
            style={{ background: "rgba(251,146,60,0.15)" }}
          >
            <MessageCircle size={13} color="#fb923c" />
          </span>
          <span className="inbox-row__msg truncate">
            <span className="font-medium">{c.userName}</span> texted you
          </span>
          <span className="inbox-row__time">
            {formatIOSTime(c.lastMessageAt)}
          </span>
        </button>
      ))}
    </div>
  );
}