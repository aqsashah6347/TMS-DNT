import { useRef, useState } from "react";
import { Send, Paperclip, Smile, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export default function ChatInput({
  draft,
  onDraftChange,
  onSend,
  onFileSelect,
  pendingFile,
  onClearFile,
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

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

    // Put the cursor right after the inserted emoji and keep focus on the
    // input, instead of losing it to the picker.
    requestAnimationFrame(() => {
      input.focus();
      const pos = start + emojiData.emoji.length;
      input.setSelectionRange(pos, pos);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = ""; // lets picking the same file twice still fire onChange
  };

  return (
    <div className="border-t border-white/10">
      {pendingFile && (
        <div className="flex items-center gap-2 px-4 pt-3">
          <span className="text-xs text-white/60 bg-white/5 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
            {pendingFile.name}
            <button
              onClick={onClearFile}
              className="text-white/40 hover:text-white"
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 relative">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Paperclip size={17} />
        </button>

        <div className="relative">
          <button
            onClick={() => setEmojiOpen((prev) => !prev)}
            className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Smile size={18} />
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
          placeholder="Type a message..."
          className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:bg-white/10"
        />
        <button
          onClick={onSend}
          className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
