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

// Most recent check-in first. Employees with no check-in today
    // (checkIn === null) are pushed to the bottom, alphabetically among
    // themselves so their order stays stable and predictable.
    roster.sort((a, b) => {
      if (!a.checkIn && !b.checkIn) return a.name.localeCompare(b.name);
      if (!a.checkIn) return 1;
      if (!b.checkIn) return -1;
      return new Date(b.checkIn) - new Date(a.checkIn);
    });

    res.json({ date: dateStr, employees: roster });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRoster };
