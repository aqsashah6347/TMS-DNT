const { poolPromise } = require("../config/db");
const attendanceService = require("../services/attendanceService");
const { fetchAllEmployees } = require("../services/zkEmployeeService");

// GET /api/employees/directory — a lighter version of /roster for member
// pickers (project members, task assignees, etc). Any authenticated user
// can hit this (unlike /roster, which is admin-only because it exposes
// attendance/check-in data). Only name/department/userId go out — no
// gender, no check-in/out, no attendance status.
//
// If the ZK employees API is unreachable (e.g. off the work network),
// this falls back to the plain tms_users list grouped under "Unassigned"
// instead of failing the whole picker — better to show flat results than
// to block project/team creation entirely.
async function getDirectory(req, res, next) {
  try {
    const pool = await poolPromise;
    const usersResult = await pool
      .request()
      .query(
        "SELECT id, name, role, enroll_no FROM tms_users WHERE status = 'active'",
      );

    let employees;
    try {
      employees = await fetchAllEmployees();
    } catch (err) {
      const directory = usersResult.recordset.map((u) => ({
        userId: u.id,
        name: u.name,
        department: "Unassigned",
      }));
      return res.json({ employees: directory });
    }

    const userByCode = new Map(
      usersResult.recordset
        .filter((u) => u.enroll_no)
        .map((u) => [attendanceService.normalizeEmployeeCode(u.enroll_no), u]),
    );

    const directory = employees
      .map((emp) => {
        const code = attendanceService.normalizeEmployeeCode(emp.employeeCode);
        const account = userByCode.get(code);
        return {
          employeeCode: emp.employeeCode,
          name: emp.fullName,
          department: emp.departmentName || "Unassigned",
          userId: account?.id || null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ employees: directory });
  } catch (err) {
    next(err);
  }
}

async function getRoster(req, res, next) {
  try {
    const dateStr = attendanceService.todayDateString();

    const [employees, logRanges, pool] = await Promise.all([
      fetchAllEmployees(),
      attendanceService.getFirstAndLastLogPerEmployeeForDate(dateStr),
      poolPromise,
    ]);

    const logByCode = new Map(logRanges.map((l) => [l.enrollNo, l]));

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

module.exports = { getRoster, getDirectory };
