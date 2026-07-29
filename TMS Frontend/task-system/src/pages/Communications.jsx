// TMS Frontend/task-system/src/pages/Communications.jsx
import { useState } from "react";
import { MailCheck, History, IdCard } from "lucide-react";
import TemplateEditor from "../Features/communications/components/TemplateEditor";
import SendLog from "../Features/communications/components/SendLog";
import ContactsDirectory from "../Features/communications/components/ContactsDirectory";

const TABS = [
  { id: "templates", label: "Templates", icon: MailCheck },
  { id: "log", label: "Send Log", icon: History },
  { id: "contacts", label: "Contacts Directory", icon: IdCard },
];

export default function Communications() {
  const [tab, setTab] = useState("templates");

  return (
    <div>
      <h2
        className="text-4xl font-semibold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Communications
      </h2>
      <p className="text-sm text-white/40 mt-1">
        Control the automatic email and WhatsApp notifications TMS sends — edit
        their content, turn channels on or off, see what went out, and look up
        everyone's enrolled contact info.
      </p>

      <div className="flex items-center gap-2 mt-5 border-b border-white/10">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-[#fb923c] text-white"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "templates" && <TemplateEditor />}
      {tab === "log" && <SendLog />}
      {tab === "contacts" && <ContactsDirectory />}
    </div>
  );
}
