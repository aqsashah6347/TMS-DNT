import { useState } from "react";
import { Paperclip, Smile, Send } from "lucide-react";
import { useChatStore } from "../chatStore";

export default function MessageInput({ threadId }) {
  const [text, setText] = useState("");
  const sendMessage = useChatStore((s) => s.sendMessage);

  function handleSend() {
    if (!text.trim()) return;
    sendMessage(threadId, text);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 px-4 sm:px-6 py-3.5 border-t border-white/[0.06] bg-[#161616]">
      <button className="p-2.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0">
        <Paperclip size={19} />
      </button>
      <button className="p-2.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0">
        <Smile size={19} />
      </button>

      <div className="flex-1 bg-white/[0.06] rounded-2xl px-4 py-2.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
          className="w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-white/35 max-h-28"
        />
      </div>

      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="p-2.5 rounded-full bg-orange-400 text-[#18181b] hover:bg-orange-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
