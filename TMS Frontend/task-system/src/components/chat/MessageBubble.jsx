import { Check, CheckCheck, FileText, Download } from "lucide-react";
import { formatMessageTime } from "../../lib/dateFormat";
import { fileUrl } from "../../api/chatApi";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageBubble({ message, mine, showSeen }) {
  const isImage = message.attachment_type?.startsWith("image/");

  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
          mine ? "bg-orange-500/20 text-white" : "bg-white/10 text-white"
        }`}
      >
        {message.attachment_url &&
          (isImage ? (
            <a
              href={fileUrl(message.attachment_url)}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={fileUrl(message.attachment_url)}
                alt={message.attachment_name || "attachment"}
                className="rounded-xl max-w-[220px] max-h-[220px] object-cover mb-1.5"
              />
            </a>
          ) : (
            <a
              href={fileUrl(message.attachment_url)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 mb-1.5 hover:bg-black/30 transition-colors"
            >
              <FileText size={18} className="shrink-0 text-white/70" />
              <div className="min-w-0">
                <p className="text-xs text-white truncate">
                  {message.attachment_name}
                </p>
                <p className="text-[10px] text-white/40">
                  {formatSize(message.attachment_size)}
                </p>
              </div>
              <Download size={14} className="shrink-0 text-white/40" />
            </a>
          ))}
        {message.message && <p>{message.message}</p>}
      </div>

      <div className="flex items-center gap-1 mt-0.5 px-1">
        <span className="text-[10px] text-white/30">
          {formatMessageTime(message.created_at)}
        </span>
        {mine &&
          showSeen &&
          (message.is_read ? (
            <CheckCheck size={12} className="text-blue-400" />
          ) : (
            <Check size={12} className="text-white/30" />
          ))}
      </div>
    </div>
  );
}
