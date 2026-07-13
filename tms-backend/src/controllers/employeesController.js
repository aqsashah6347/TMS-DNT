const attendanceService = require("../services/attendanceService");
const { fetchAllEmployees } = require("../services/zkEmployeeService");

// GET /api/employees/roster  (admin only)
// Full active-employee roster with today's live present/absent status,
// straight from the ZK employees + logs APIs — no tms_users dependency.
async function getRoster(req, res, next) {
  try {
    const dateStr = attendanceService.todayDateString();

    const [employees, logRanges] = await Promise.all([
      fetchAllEmployees(),
      attendanceService.getFirstAndLastLogPerEmployeeForDate(dateStr),
    ]);

    const logByCode = new Map(logRanges.map((l) => [l.enrollNo, l]));

    const roster = employees.map((emp) => {
      const log = logByCode.get(emp.employeeCode);
      return {
        employeeCode: emp.employeeCode,
        name: emp.fullName,
        gender: emp.gender || null,
        department: emp.departmentName || "—",
        status: log ? "present" : "absent",
        checkIn: log?.checkIn || null,
        checkOut: log?.checkOut || null,
      };
    });

    roster.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ date: dateStr, employees: roster });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRoster };
