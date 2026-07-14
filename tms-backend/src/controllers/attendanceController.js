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

module.exports = { getTodayAttendance };
