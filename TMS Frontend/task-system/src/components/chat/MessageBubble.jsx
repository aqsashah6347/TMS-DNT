import { Check, CheckCheck, FileText, Download } from "lucide-react";
import { formatMessageTime } from "../../lib/dateFormat";
import { fileUrl } from "../../api/chatApi";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// senderName: optional — pass this in group/team chat so messages from
// other members are labeled with who sent them. Left out (default) for
// 1:1 DMs, where it's obvious who's talking.
export default function MessageBubble({
  message,
  mine,
  showSeen,
  senderName,
}) {
  const isImage = message.attachment_type?.startsWith("image/");

  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      {!mine && senderName && (
        <span className="text-xs text-white/40 px-1 mb-1">{senderName}</span>
      )}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${
          mine ? "bg-orange-500 text-white" : "bg-[#262626] text-white"
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
                className="rounded-xl max-w-[240px] max-h-[240px] object-cover mb-2"
              />
            </a>
          ) : (
            <a
              href={fileUrl(message.attachment_url)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2.5 mb-2 hover:bg-black/35 transition-colors"
            >
              <FileText size={20} className="shrink-0 text-white/80" />
              <div className="min-w-0">
                <p className="text-sm text-white truncate">
                  {message.attachment_name}
                </p>
                <p className="text-xs text-white/50">
                  {formatSize(message.attachment_size)}
                </p>
              </div>
              <Download size={15} className="shrink-0 text-white/50" />
            </a>
          ))}
        {message.message && <p>{message.message}</p>}
      </div>

      <div className="flex items-center gap-1 mt-1 px-1">
        <span className="text-xs text-white/35">
          {formatMessageTime(message.created_at)}
        </span>
        {mine &&
          showSeen &&
          (message.is_read ? (
            <CheckCheck size={13} className="text-blue-400" />
          ) : (
            <Check size={13} className="text-white/35" />
          ))}
      </div>
    </div>
  );
}