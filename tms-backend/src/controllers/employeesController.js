const attendanceService = require("../services/attendanceService");
const { fetchAllEmployees } = require("../services/zkEmployeeService");

async function getRoster(req, res, next) {
  try {
    const dateStr = attendanceService.todayDateString();

    const [employees, logRanges] = await Promise.all([
      fetchAllEmployees(),
      attendanceService.getFirstAndLastLogPerEmployeeForDate(dateStr),
    ]);

    const logByCode = new Map(logRanges.map((l) => [l.enrollNo, l]));

    const roster = employees.map((emp) => {
      const code = attendanceService.normalizeEmployeeCode(emp.employeeCode);
      const log = logByCode.get(code);
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
