function renderMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function MessageBubble({ message }) {
  const isMe = message.sender === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 ${
          isMe
            ? "bg-orange-400/90 text-[#18181b] rounded-br-sm"
            : "bg-white/[0.06] backdrop-blur-md border border-white/[0.08] text-white rounded-bl-sm"
        }`}
      >
        {message.type === "code" ? (
          <pre className="text-xs font-mono bg-black/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-orange-200">
            {message.text}
          </pre>
        ) : message.type === "markdown" ? (
          <p className="text-sm leading-relaxed">
            {renderMarkdown(message.text)}
          </p>
        ) : (
          <p className="text-sm leading-relaxed">{message.text}</p>
        )}

        <p
          className={`text-[10px] mt-1.5 text-right ${
            isMe ? "text-[#18181b]/60" : "text-white/40"
          }`}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}
