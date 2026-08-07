// src/Features/performance/components/ReportLogsModal.jsx
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { initials } from "../utils";

const AVATAR_PALETTE = [
  "#fb923c",
  "#60a5fa",
  "#34d399",
  "#a78bfa",
  "#f472b6",
  "#facc15",
  "#22d3ee",
];

function colorFor(id, fallback) {
  return fallback || AVATAR_PALETTE[Math.abs(id || 0) % AVATAR_PALETTE.length];
}

export default function ReportLogsModal({
  teams,
  isOpen,
  onClose,
  onSelectTeam,
}) {
  const pending = (teams || []).filter(
    (t) => t.totalCount > 0 && !t.fullyMarked,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Logs"
      width="max-w-[32rem]"
    >
      <p className="text-white/45 text-xs mb-4">
        Managers who haven't finished marking their team's monthly report yet.
      </p>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-2 py-10">
          <CheckCircle2 size={28} className="text-emerald-400" />
          <p className="text-sm text-white/60">
            Every manager is caught up this period.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/10 max-h-[26rem] overflow-y-auto -mx-1">
          {pending.map((t) => (
            <button
              key={t.teamId}
              type="button"
              onClick={() => onSelectTeam(t.teamId)}
              className="flex items-center gap-3 px-1 py-3 text-left hover:bg-white/[0.04] transition-colors rounded-lg"
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-semibold"
                style={{
                  background: `${colorFor(t.managerId, t.managerAvatarColor)}22`,
                  borderColor: `${colorFor(t.managerId, t.managerAvatarColor)}55`,
                  color: colorFor(t.managerId, t.managerAvatarColor),
                }}
              >
                {initials(t.managerName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium truncate">
                  {t.managerName}
                </p>
                <p className="text-[11px] text-white/45 truncate flex items-center gap-1">
                  <AlertTriangle
                    size={10}
                    className="text-amber-400 shrink-0"
                  />
                  {t.teamName} ·{" "}
                  {t.markedCount === 0
                    ? "hasn't marked anyone yet"
                    : `${t.markedCount}/${t.totalCount} marked`}
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-300 shrink-0">
                {t.totalCount - t.markedCount} left
              </span>
              <ChevronRight size={14} className="text-white/30 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
