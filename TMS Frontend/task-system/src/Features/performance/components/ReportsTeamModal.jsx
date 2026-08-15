// src/Features/performance/components/ReportsTeamModal.jsx
import { useEffect, useState } from "react";
import {
  Loader2,
  Check,
  Crown,
  CalendarClock,
  Star,
  Send,
  Lock,
  Clock,
} from "lucide-react";
import Modal from "../../../components/ui/Modal";
import RadialProgress from "../../../components/ui/RadialProgress";
import { monthlyReportApi } from "../../../api/monthlyReportApi";
import { initials } from "../utils";

const MODAL_BG = "#17130f"; // matches .glass-modal background — used so badge rings blend in

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

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_META = {
  pending: {
    label: "Not filed",
    icon: Clock,
    color: "#a3a3a3",
    className: "bg-white/10 text-white/50 border-white/15",
  },
  submitted: {
    label: "Submitted",
    icon: Send,
    color: "#60a5fa",
    className: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  released: {
    label: "Released",
    icon: Lock,
    color: "#34d399",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
};

// Unmarked members get the bigger, action-oriented tile (wider span so
// the score input is easy to hit); already-marked members collapse to a
// compact summary tile. That's what gives the grid its non-linear,
// bento feel instead of a uniform list.
function MemberTile({ member, teamId, onRated }) {
  const [value, setValue] = useState(
    member.rating != null ? String(member.rating) : "",
  );
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [rowError, setRowError] = useState(null);
  const marked = member.rating !== null && member.rating !== undefined;
  const color = colorFor(member.id, member.avatarColor);
  const ringPct = marked ? member.rating * 10 : 0;

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
      const result = await monthlyReportApi.setRating(teamId, member.id, num);
      onRated(member.id, result.rating, result.ratedAt);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1200);
    } catch (err) {
      setRowError(err.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 ${
        marked
          ? "sm:col-span-1 bg-emerald-500/[0.06] border-emerald-500/25"
          : "sm:col-span-2 bg-white/[0.04] border-white/10"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <RadialProgress
            value={ringPct}
            size={46}
            strokeWidth={4}
            color={marked ? "#34d399" : "rgba(255,255,255,0.18)"}
            trackColor="rgba(255,255,255,0.08)"
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold"
              style={{ background: `${color}22`, color }}
            >
              {initials(member.name)}
            </span>
          </RadialProgress>
          {marked && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
              style={{ border: `2px solid ${MODAL_BG}` }}
            >
              <Check size={9} className="text-black" strokeWidth={3} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-white font-medium truncate">
            {member.name}
          </p>
          {marked ? (
            <p className="text-[11px] text-white/40 flex items-center gap-1">
              <CalendarClock size={11} />
              {formatDate(member.ratedAt)}
            </p>
          ) : (
            <p className="text-[11px] text-amber-300/80">Not marked yet</p>
          )}
        </div>

        {marked && (
          <span className="text-xl font-semibold text-emerald-300 shrink-0">
            {member.rating}
            <span className="text-[10px] text-emerald-300/50">/10</span>
          </span>
        )}
      </div>

      {/* locked check removed — this modal is admin-only, so the score
          input stays available even after the report is released. */}
      {
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 bg-white/5 rounded-xl px-2.5 py-1.5">
            <Star size={13} className="text-orange-300 shrink-0" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              className="bg-transparent outline-none text-white text-sm w-full"
              placeholder={marked ? "Update score" : "Score 0–10"}
              value={value}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              disabled={saving}
            />
          </div>
          <button
            type="button"
            className="glass-btn glass-btn--sm shrink-0"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : justSaved ? (
              <Check size={12} />
            ) : marked ? (
              "Update"
            ) : (
              "Mark"
            )}
          </button>
        </div>
      }
      {rowError && <span className="text-red-400 text-[10px]">{rowError}</span>}
    </div>
  );
}

// Small toggle for the modal's top bar (passed as Modal's headerRight) —
// this is what overrides the filing-window date restriction for just
// this team. Kept tiny and label-first since it sits next to the ✕.
function VisibilityToggle({ checked, onToggle, disabled }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-xs text-white/50 whitespace-nowrap">
        Make visible
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        disabled={disabled}
        className={`relative w-9 h-5 rounded-full shrink-0 transition-colors disabled:opacity-40 ${
          checked ? "bg-orange-500" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export default function ReportsTeamModal({ team, isOpen, onClose, onChanged }) {
  const [members, setMembers] = useState(team?.members || []);
  const [forceVisible, setForceVisibleState] = useState(!!team?.forceVisible);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState(null);

  useEffect(() => {
    setMembers(team?.members || []);
    setForceVisibleState(!!team?.forceVisible);
  }, [team]);

  if (!team) return null;

  // `locked` is no longer used to gate the UI — this modal is
  // admin-only, so ratings/visibility stay editable even after
  // release. Left here (commented) in case a future non-admin view
  // needs to reintroduce a lock.
  // const locked = team.status === "released";
  const markedCount = members.filter((m) => m.rating != null).length;
  const progressPct =
    members.length > 0 ? Math.round((markedCount / members.length) * 100) : 0;
  const status = STATUS_META[team.status] || STATUS_META.pending;
  const StatusIcon = status.icon;
  const managerColor = colorFor(team.managerId, team.managerAvatarColor);

  function handleRated(memberId, rating, ratedAt) {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, rating, ratedAt } : m)),
    );
    onChanged?.();
  }

  async function handleToggleVisible() {
    const next = !forceVisible;
    setToggling(true);
    setToggleError(null);
    try {
      await monthlyReportApi.setForceVisible(team.teamId, next);
      setForceVisibleState(next);
      onChanged?.();
    } catch (err) {
      setToggleError(
        err.response?.data?.message || "Couldn't update visibility",
      );
    } finally {
      setToggling(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${team.teamName} — ${MONTH_NAMES[new Date().getMonth() + 1]} Report`}
      width="max-w-[42rem]"
      headerRight={
        <VisibilityToggle
          checked={forceVisible}
          onToggle={handleToggleVisible}
          disabled={toggling}
        />
      }
    >
      {toggleError && (
        <p className="text-[11px] text-red-400 -mt-2 mb-3">{toggleError}</p>
      )}

      {/* ── Header bento row, now with graphics instead of plain text ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="sm:col-span-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold relative"
            style={{ background: `${managerColor}22`, color: managerColor }}
          >
            {initials(team.managerName)}
            <Crown
              size={13}
              className="text-amber-400 absolute -top-1.5 -right-1.5 bg-[#17130f] rounded-full p-0.5"
              style={{ width: 16, height: 16 }}
            />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              Manager
            </p>
            <p className="text-sm text-white font-medium truncate">
              {team.managerName}
            </p>
          </div>
        </div>

        <div className="sm:col-span-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
          <RadialProgress
            value={progressPct}
            size={40}
            strokeWidth={4}
            color={progressPct === 100 ? "#34d399" : "#fb923c"}
            trackColor="rgba(255,255,255,0.08)"
          >
            <span className="text-[10px] font-semibold text-white">
              {progressPct}%
            </span>
          </RadialProgress>
          <div className="min-w-0">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              Progress
            </p>
            <p className="text-sm text-white font-medium">
              {markedCount}/{members.length} marked
            </p>
          </div>
        </div>

        <div className="sm:col-span-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${status.color}22` }}
          >
            <StatusIcon size={17} style={{ color: status.color }} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              Status
            </p>
            <p className="text-sm font-medium" style={{ color: status.color }}>
              {status.label}
            </p>
          </div>
        </div>
      </div>

      {/* ── Member bento grid ────────────────────────────────────── */}
      {members.length === 0 ? (
        <p className="text-white/40 text-sm py-8 text-center">
          No team members to rate yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[24rem] overflow-y-auto pr-1">
          {members.map((member) => (
            <MemberTile
              key={member.id}
              member={member}
              teamId={team.teamId}
              onRated={handleRated}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
