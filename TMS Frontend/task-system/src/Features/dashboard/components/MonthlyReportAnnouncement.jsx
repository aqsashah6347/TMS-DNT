// src/Features/dashboard/components/MonthlyReportAnnouncement.jsx
import { useEffect, useState } from "react";
import { Megaphone, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { monthlyReportApi } from "../../../api/monthlyReportApi";
import Card from "../../../components/ui/Card";

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

export default function MonthlyReportAnnouncement() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    monthlyReportApi
      .getAnnouncement()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data || !data.released) return null;

  return (
    <Card
      hover
      onClick={() => navigate("/performance")}
      className="cascade-in border border-emerald-500/30 cursor-pointer"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Megaphone size={16} className="text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold">
              {MONTH_NAMES[data.period.month]} {data.period.year} report
              announced
            </p>
            <p className="text-white/50 text-[11px]">
              Click to view your result
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-white/40 shrink-0" />
      </div>
    </Card>
  );
}
