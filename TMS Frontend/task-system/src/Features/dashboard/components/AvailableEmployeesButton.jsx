import { useState } from "react";
import { Users } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { useAuthStore } from "../../../store/useAuthStore";
import { attendanceApi } from "../../../api/attendanceApi";

// Admin-only button that opens a modal listing everyone who has clocked
// in today via the ZKTeco device, with name + department.
export default function PresentEmployeesButton() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [unmatchedCount, setUnmatchedCount] = useState(0);

  if (user?.role !== "admin") return null;

  async function handleOpen() {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    try {
      const data = await attendanceApi.getTodayAttendance();
      setEmployees(data.employees || []);
      setUnmatchedCount(data.unmatchedCount || 0);
    } catch (err) {
      setError(
        err.response?.data?.message || "Couldn't load today's attendance",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button className="quick-action-btn" onClick={handleOpen}>
        <span
          className="quick-action-btn__icon"
          style={{ background: "rgba(74, 222, 128, 0.15)" }}
        >
          <Users size={16} color="#4ade80" />
        </span>
        Present Employees
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Present Employees Today"
      >
        {isLoading && (
          <p className="text-sm text-white/50">Loading attendance…</p>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!isLoading && !error && employees.length === 0 && (
          <p className="text-sm text-white/50">
            No one has checked in yet today.
          </p>
        )}

        {!isLoading && !error && employees.length > 0 && (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {employees.map((emp, i) => (
              <div
                key={`${emp.name}-${i}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{emp.name}</p>
                  <p className="text-xs text-white/40 truncate">
                    {emp.department}
                  </p>
                </div>
                <span className="text-xs text-white/40 shrink-0">
                  {new Date(emp.firstLogTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && unmatchedCount > 0 && (
          <p className="text-xs text-white/30 mt-3">
            {unmatchedCount} device log{unmatchedCount === 1 ? "" : "s"} today
            didn't match a known employee.
          </p>
        )}
      </Modal>
    </>
  );
}
