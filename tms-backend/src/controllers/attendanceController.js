const attendanceService = require("../services/attendanceService");
const { fetchAllEmployees } = require("../services/zkEmployeeService");

async function getTodayAttendance(req, res, next) {
  try {
    const dateStr = attendanceService.todayDateString();

    const [logs, employees] = await Promise.all([
      attendanceService.getFirstLogPerEmployeeForDate(dateStr),
      fetchAllEmployees(),
    ]);

    const employeeByCode = new Map(
      employees.map((e) => [
        attendanceService.normalizeEmployeeCode(e.employeeCode),
        e,
      ]),
    );

    const present = [];
    let unmatchedCount = 0;

    for (const log of logs) {
      const emp = employeeByCode.get(log.enrollNo);
      if (!emp) {
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

// GET /api/attendance/employee/:employeeCode?range=today|week|month
// Builds one entry per calendar day in the range (even days with no log,
// so the employee modal can show "Absent" instead of just skipping them).
async function getEmployeeAttendanceHistory(req, res, next) {
  try {
    const { employeeCode } = req.params;
    const rangeKey = ["today", "week", "month"].includes(req.query.range)
      ? req.query.range
      : "today";

    const { from, to } = attendanceService.dateRangeFor(rangeKey);
    const normalizedCode = attendanceService.normalizeEmployeeCode(employeeCode);

    const [byEmployee, employees] = await Promise.all([
      attendanceService.getDailyLogsPerEmployeeForRange(from, to),
      fetchAllEmployees(),
    ]);

    const emp = employees.find(
      (e) =>
        attendanceService.normalizeEmployeeCode(e.employeeCode) ===
        normalizedCode,
    );

    const daysForEmployee = byEmployee.get(normalizedCode) || new Map();

    const days = [];
    const cursor = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    while (cursor <= end) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, "0");
      const dd = String(cursor.getDate()).padStart(2, "0");
      const dayStr = `${yyyy}-${mm}-${dd}`;
      const log = daysForEmployee.get(dayStr);
      days.push({
        date: dayStr,
        checkIn: log?.checkIn || null,
        checkOut: log && log.checkOut !== log.checkIn ? log.checkOut : null,
        present: Boolean(log),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    days.reverse(); // most recent day first

    res.json({
      employeeCode,
      name: emp?.fullName || null,
      department: emp?.departmentName || "—",
      range: rangeKey,
      from,
      to,
      days,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTodayAttendance, getEmployeeAttendanceHistory };