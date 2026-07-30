// TMS Frontend/task-system/src/Features/communications/components/TemplateEditor.jsx
import { useEffect, useState } from "react";
import { Mail, MessageCircle, Save, Check } from "lucide-react";
import { useCommunicationsStore, TYPE_LABELS } from "../communicationsStore";

const VARS_BY_TYPE = {
  task_assigned: [
    "userName",
    "taskTitle",
    "projectName",
    "priority",
    "dueDate",
    "assignedBy",
    "taskLink",
  ],
  deadline_24h: [
    "userName",
    "taskTitle",
    "projectName",
    "priority",
    "dueDate",
    "taskLink",
  ],
  progress_reminder: [
    "userName",
    "taskCount",
    "taskListHtml",
    "taskListText",
    "taskLink",
  ],
};

function SettingCard({ setting }) {
  const saveSetting = useCommunicationsStore((s) => s.saveSetting);
  const isSaving = useCommunicationsStore((s) => s.isSaving);

  const [enabled, setEnabled] = useState(setting.enabled);
  const [subject, setSubject] = useState(setting.subjectTemplate || "");
  const [body, setBody] = useState(setting.bodyTemplate || "");
  const [saved, setSaved] = useState(false);
  const isEmail = setting.channel === "email";

  useEffect(() => {
    setEnabled(setting.enabled);
    setSubject(setting.subjectTemplate || "");
    setBody(setting.bodyTemplate || "");
  }, [
    setting.id,
    setting.enabled,
    setting.subjectTemplate,
    setting.bodyTemplate,
  ]);

  const dirty =
    enabled !== setting.enabled ||
    subject !== (setting.subjectTemplate || "") ||
    body !== (setting.bodyTemplate || "");

  const handleSave = async () => {
    const ok = await saveSetting(setting.id, {
      enabled,
      subjectTemplate: isEmail ? subject : null,
      bodyTemplate: body,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="glass glass-card">
      <div className="glass-content">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isEmail ? (
              <Mail size={16} className="text-white/50" />
            ) : (
              <MessageCircle size={16} className="text-white/50" />
            )}
            <h4 className="text-sm font-semibold text-white">
              {isEmail ? "Email" : "WhatsApp"}
            </h4>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs text-white/50">
              {enabled ? "Sending" : "Turned off"}
            </span>
            <span
              onClick={() => setEnabled((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                enabled ? "bg-[#fb923c]" : "bg-white/15"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  enabled ? "translate-x-[18px]" : "translate-x-[3px]"
                }`}
              />
            </span>
          </label>
        </div>

        {isEmail && (
          <div className="mb-3">
            <label className="text-xs text-white/50 mb-1 block">Subject</label>
            <input
              className="glass-input w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line…"
            />
          </div>
        )}

        <div className="mb-2">
          <label className="text-xs text-white/50 mb-1 block">
            {isEmail ? "Body (HTML)" : "Message"}
          </label>
          <textarea
            className="glass-textarea w-full font-mono text-xs"
            rows={isEmail ? 10 : 6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-[11px] text-white/40">
            Available:{" "}
            {VARS_BY_TYPE[setting.type].map((v) => `{{${v}}}`).join("  ")}
          </p>
          <button
            onClick={handleSave}
            disabled={!dirty || isSaving}
            className="glass glass-btn glass-btn--primary glass-btn--sm flex items-center gap-1.5 disabled:opacity-40"
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplateEditor() {
  const settings = useCommunicationsStore((s) => s.settings);
  const fetchSettings = useCommunicationsStore((s) => s.fetchSettings);
  const isLoadingSettings = useCommunicationsStore((s) => s.isLoadingSettings);
  const error = useCommunicationsStore((s) => s.error);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (isLoadingSettings && settings.length === 0) {
    return <div className="text-sm text-white/50 mt-4">Loading templates…</div>;
  }

  if (error && settings.length === 0) {
    return <div className="text-sm text-red-400 mt-4">{error}</div>;
  }

  const types = Object.keys(TYPE_LABELS);

  if (settings.length === 0) {
    return (
      <div className="text-sm text-white/50 mt-4">
        No notification templates found. Make sure the notification settings
        have been seeded on the server.
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {types.map((type) => {
        const rows = settings.filter((s) => s.type === type);
        if (rows.length === 0) return null;
        return (
          <div key={type}>
            <h3 className="text-sm font-semibold text-white/80 mb-2">
              {TYPE_LABELS[type]}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {rows.map((setting) => (
                <SettingCard key={setting.id} setting={setting} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
