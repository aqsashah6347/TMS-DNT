import { useChatStore } from "./chatStore";
import ThreadSidebar from "./components/ThreadSidebar";
import ChatHeader from "./components/ChatHeader";
import MessageFeed from "./components/MessageFeed";
import MessageInput from "./components/MessageInput";
import NotificationDrawer from "./components/NotificationDrawer";

export default function ChatDashboard() {
  const { threads, activeThreadId, messagesByThread } = useChatStore();
  const activeThread = threads.find((t) => t.id === activeThreadId);
  const messages = messagesByThread[activeThreadId] || [];

  return (
    <div className="h-[calc(100vh-9.5rem)] rounded-[24px] overflow-hidden border border-white/[0.08] flex shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <ThreadSidebar />

      <div className="hidden md:flex flex-1 flex-col h-full min-w-0">
        <ChatHeader thread={activeThread} />
        <MessageFeed messages={messages} />
        <MessageInput threadId={activeThreadId} />
      </div>

      <div className="flex md:hidden flex-1 flex-col h-full min-w-0">
        <ChatHeader thread={activeThread} />
        <MessageFeed messages={messages} />
        <MessageInput threadId={activeThreadId} />
      </div>

      <NotificationDrawer />
    </div>
  );
}
