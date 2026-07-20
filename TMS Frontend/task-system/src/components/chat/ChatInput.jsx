import { useRef, useState } from "react";
import { Send, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export default function ChatInput({ draft, onDraftChange, onSend }) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef(null);

  const insertEmoji = (emojiData) => {
    const input = inputRef.current;
    if (!input) {
      onDraftChange(draft + emojiData.emoji);
      return;
    }
    const start = input.selectionStart ?? draft.length;
    const end = input.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emojiData.emoji + draft.slice(end);
    onDraftChange(next);

    requestAnimationFrame(() => {
      input.focus();
      const pos = start + emojiData.emoji.length;
      input.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="border-t border-white/10 bg-[#1c1c1c]">
      <div className="flex items-center gap-2 px-5 py-3.5 relative">
        <div className="relative">
          <button
            onClick={() => setEmojiOpen((prev) => !prev)}
            className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Smile size={19} />
          </button>

          {emojiOpen && (
            <div className="absolute bottom-12 left-0 z-40 shadow-2xl rounded-2xl overflow-hidden">
              <EmojiPicker
                onEmojiClick={insertEmoji}
                theme="dark"
                autoFocusSearch={false}
              />
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          onFocus={() => setEmojiOpen(false)}
          placeholder="Write a message..."
          className="flex-1 bg-[#2a2a2a] rounded-xl px-4 py-2.5 text-[15px] text-white placeholder-white/30 outline-none focus:bg-[#323232]"
        />
        <button
          onClick={onSend}
          className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}