const { poolPromise } = require("../config/db");
const attendanceService = require("../services/attendanceService");
const { fetchAllEmployees } = require("../services/zkEmployeeService");

async function getRoster(req, res, next) {
  try {
    const dateStr = attendanceService.todayDateString();

    const [employees, logRanges, pool] = await Promise.all([
      fetchAllEmployees(),
      attendanceService.getFirstAndLastLogPerEmployeeForDate(dateStr),
      poolPromise,
    ]);

    const logByCode = new Map(logRanges.map((l) => [l.enrollNo, l]));

    // tms_users.enroll_no links a login account back to a ZK employeeCode
    // (see 003_add_enroll_no.sql). Matched here so the Access page can
    // assign roles/permissions directly from the ZK roster without a
    // separate employee picker — employees with no matching row just
    // don't have a login account yet.
    const usersResult = await pool
      .request()
      .query(
        "SELECT id, role, enroll_no FROM tms_users WHERE enroll_no IS NOT NULL",
      );
    const userByCode = new Map(
      usersResult.recordset.map((u) => [
        attendanceService.normalizeEmployeeCode(u.enroll_no),
        u,
      ]),
    );

    const roster = employees.map((emp) => {
      const code = attendanceService.normalizeEmployeeCode(emp.employeeCode);
      const log = logByCode.get(code);
      const account = userByCode.get(code);
      return {
        employeeCode: emp.employeeCode,
        name: emp.fullName,
        gender: emp.gender || null,
        department: emp.departmentName || "—",
        status: log ? "present" : "absent",
        checkIn: log?.checkIn || null,
        checkOut: log?.checkOut || null,
        userId: account?.id || null,
        role: account?.role || null,
      };
    });

    roster.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ date: dateStr, employees: roster });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRoster };
