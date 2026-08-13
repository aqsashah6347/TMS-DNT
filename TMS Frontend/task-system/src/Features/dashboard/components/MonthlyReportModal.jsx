// src/Features/dashboard/components/MonthlyReportModal.jsx
import { useEffect, useState } from "react";
import { Loader2, Check, Star, Send } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { monthlyReportApi } from "../../../api/monthlyReportApi";

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthlyReportModal({ teamId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !teamId) return;
    setLoading(true);
    setError(null);
    monthlyReportApi
      .getCurrentReport(teamId)
      .then(setReport)
      .catch((err) =>
        setError(err.response?.data?.message || "Couldn't load the roster"),
      )
      .finally(() => setLoading(false));
  }, [isOpen, teamId]);

  async function handleRate(memberId, rating) {
    const result = await monthlyReportApi.setRating(teamId, memberId, rating);
    setReport(
      (prev) =>
        prev && {
          ...prev,
          members: prev.members.map((m) =>
            m.id === memberId
              ? { ...m, rating: result.rating, ratedAt: result.ratedAt }
              : m,
          ),
        },
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await monthlyReportApi.submitReport(teamId);
      setReport((prev) => prev && { ...prev, status: "submitted" });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit the report");
    } finally {
      setSubmitting(false);
    }
  }

  const title = report
    ? `${report.teamName} — ${MONTH_NAMES[report.period.month]} ${report.period.year} Report`
    : "Monthly Report";

  const ratedCount =
    report?.members.filter((m) => m.rating != null).length ?? 0;
  const totalCount = report?.members.length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="max-w-[36rem]"
    >
      {loading && (
        <div className="flex items-center justify-center py-10 text-white/50">
          <Loader2 size={20} className="animate-spin" />
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {!loading && report && (
        <>
          <p className="text-white/50 text-xs mb-4">
            Rate each team member (0–10). {ratedCount}/{totalCount} rated.
            {report.status === "submitted" &&
              " Filed — you can still update ratings until it's released."}
          </p>

          <div className="flex flex-col gap-2 max-h-[22rem] overflow-y-auto pr-1">
            {report.members.map((member) => (
              <RosterRow key={member.id} member={member} onRate={handleRate} />
            ))}
            {report.members.length === 0 && (
              <p className="text-white/40 text-sm py-6 text-center">
                No team members to rate yet.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
            <span className="text-white/40 text-xs">
              {report.status === "submitted" ? "Filed" : "Not filed yet"}
            </span>
            <button
              type="button"
              className="glass-btn glass-btn--primary glass-btn--sm flex items-center gap-1.5"
              onClick={handleSubmit}
              disabled={submitting || totalCount === 0}
            >
              {submitting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              {report.status === "submitted"
                ? "Re-submit report"
                : "Submit report"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function RosterRow({ member, onRate }) {
  const [value, setValue] = useState(
    member.rating != null ? String(member.rating) : "",
  );
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [rowError, setRowError] = useState(null);

  function handleChange(e) {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setValue(digits === "" ? "" : String(Math.min(10, Number(digits))));
    setRowError(null);
  }

  async function handleSave() {
    const num = Number(value);
    if (value === "" || Number.isNaN(num) || num < 0 || num > 10) {
      setRowError("0–10");
      return;
    }
    setSaving(true);
    setRowError(null);
    try {
      await onRate(member.id, num);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1200);
    } catch (err) {
      setRowError(err.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Star size={13} className="text-orange-300 shrink-0" />
        <span className="text-white text-sm truncate">{member.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          className="glass-input"
          style={{ width: "3.5rem", textAlign: "center" }}
          placeholder="0–10"
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          disabled={saving}
        />
        <button
          type="button"
          className="glass-btn glass-btn--sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : justSaved ? (
            <Check size={12} />
          ) : (
            "Save"
          )}
        </button>
        {rowError && (
          <span className="text-red-400 text-[10px]">{rowError}</span>
        )}
      </div>
    </div>
  );
}
