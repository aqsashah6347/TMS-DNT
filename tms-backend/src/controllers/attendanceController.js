const attendanceService = require("../services/attendanceService");
const { fetchAllEmployees } = require("../services/zkEmployeeService");

// GET /api/attendance/today  (admin only)
// Joins today's ZK device logs directly against the ZK employees list
// (by enrollNo === employeeCode) so we get live name + department with
// zero dependency on tms_users — no manual linking needed.
async function getTodayAttendance(req, res, next) {
  try {
    const dateStr = attendanceService.todayDateString();

    const [logs, employees] = await Promise.all([
      attendanceService.getFirstLogPerEmployeeForDate(dateStr),
      fetchAllEmployees(),
    ]);

    const employeeByCode = new Map(employees.map((e) => [e.employeeCode, e]));

    const present = [];
    let unmatchedCount = 0;

    for (const log of logs) {
      const emp = employeeByCode.get(log.enrollNo);
      if (!emp) {
        // Logged on the device but not found (or inactive) in the
        // employees API — shouldn't happen often, just skip it.
        unmatchedCount += 1;
        continue;
      }
      present.push({
        name: emp.fullName,
        department: emp.departmentName || "—",
        firstLogTime: log.firstLogTime,
      });
    }

    present.sort((a, b) => new Date(a.firstLogTime) - new Date(b.firstLogTime));

    res.json({ date: dateStr, employees: present, unmatchedCount });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTodayAttendance };
