import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function MessageFeed({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 flex flex-col gap-3"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(251,146,60,0.04), transparent 40%), radial-gradient(circle at 80% 70%, rgba(180,144,245,0.04), transparent 40%)",
      }}
    >
      {messages.length === 0 ? (
        <p className="text-center text-sm text-white/40 my-auto">
          No messages yet. Say hello 👋
        </p>
      ) : (
        messages.map((m) => <MessageBubble key={m.id} message={m} />)
      )}
      <div ref={bottomRef} />
    </div>
  );
}
