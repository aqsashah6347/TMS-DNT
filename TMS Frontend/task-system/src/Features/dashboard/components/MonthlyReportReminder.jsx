// src/Features/dashboard/components/MonthlyReportReminder.jsx
import { useEffect, useState } from "react";
import { ClipboardList, ChevronRight } from "lucide-react";
import { monthlyReportApi } from "../../../api/monthlyReportApi";
import Card from "../../../components/ui/Card";
import MonthlyReportModal from "./MonthlyReportModal";

export default function MonthlyReportReminder() {
  const [data, setData] = useState(null);
  const [openTeamId, setOpenTeamId] = useState(null);

  function refresh() {
    monthlyReportApi
      .getReminders()
      .then(setData)
      .catch(() => setData(null));
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!data || !data.active || data.teams.length === 0) return null;

  return (
    <>
      <Card className="cascade-in border border-orange-500/30">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={15} className="text-orange-400" />
          <h3 className="text-sm font-semibold text-white">
            Monthly Report{data.teams.length > 1 ? "s" : ""} Due
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {data.teams.map((team) => (
            <button
              key={team.teamId}
              type="button"
              onClick={() => setOpenTeamId(team.teamId)}
              className="flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-3 py-2.5 text-left"
            >
              <div>
                <p className="text-white text-sm">{team.teamName}</p>
                <p className="text-white/40 text-[11px]">
                  {team.status === "submitted"
                    ? `Filed — ${team.ratedCount}/${team.totalCount} rated`
                    : `${team.ratedCount}/${team.totalCount} rated`}
                </p>
              </div>
              <ChevronRight size={14} className="text-white/40 shrink-0" />
            </button>
          ))}
        </div>
      </Card>

      <MonthlyReportModal
        teamId={openTeamId}
        isOpen={openTeamId !== null}
        onClose={() => {
          setOpenTeamId(null);
          refresh();
        }}
      />
    </>
  );
}
