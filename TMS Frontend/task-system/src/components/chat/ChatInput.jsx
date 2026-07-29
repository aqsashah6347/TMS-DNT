import { useRef, useState } from "react";
import { Send, Smile, Paperclip, X, FileText } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 15MB matches the backend multer limit in uploadRoutes.js — checked
// here too so the user gets an instant message instead of waiting on
// a failed network request.
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export default function ChatInput({
  draft,
  onDraftChange,
  onSend,
  pendingFile,
  onFileSelect,
  onRemoveFile,
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [fileError, setFileError] = useState("");
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

    requestAnimationFrame(() => {
      input.focus();
      const pos = start + emojiData.emoji.length;
      input.setSelectionRange(pos, pos);
    });
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File is too large — max size is 15MB.");
      return;
    }
    setFileError("");
    onFileSelect?.(file);
  };

  const handleSend = () => {
    setFileError("");
    onSend();
  };

  const isPendingImage = pendingFile?.type?.startsWith("image/");
  const pendingPreviewUrl = isPendingImage
    ? URL.createObjectURL(pendingFile)
    : null;

  return (
    <div className="border-t border-white/10 bg-[#1c1c1c]">
      {fileError && (
        <div className="px-5 pt-2 text-xs text-red-400">{fileError}</div>
      )}

      {pendingFile && (
        <div className="px-5 pt-3">
          <div className="inline-flex items-center gap-2.5 rounded-xl bg-[#2a2a2a] px-3 py-2 max-w-full">
            {isPendingImage ? (
              <img
                src={pendingPreviewUrl}
                alt={pendingFile.name}
                className="w-9 h-9 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-black/25 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-white/70" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm text-white truncate max-w-[220px]">
                {pendingFile.name}
              </p>
              <p className="text-xs text-white/45">
                {formatSize(pendingFile.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFileError("");
                onRemoveFile?.();
              }}
              className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

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

        <button
          onClick={handlePickFile}
          title="Attach a file"
          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <Paperclip size={19} />
        </button>
        {/* accept left open so every file type — pdf, mp4, images, docs,
            zips, whatever — is selectable; the backend upload route
            (uploadRoutes.js) doesn't restrict mimetype either. */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          onFocus={() => setEmojiOpen(false)}
          placeholder="Write a message..."
          className="flex-1 bg-[#2a2a2a] rounded-xl px-4 py-2.5 text-[15px] text-white placeholder-white/30 outline-none focus:bg-[#323232]"
        />
        <button
          onClick={handleSend}
          className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}