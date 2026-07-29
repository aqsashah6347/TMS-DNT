// tms-backend/src/services/contactSyncService.js
// Keeps tms_users.phone / tms_users.contact_email up to date from the
// company HRM employees API (the same one zkEmployeeService.js and login
// already use — ZK_EMPLOYEES_API_URL in .env, currently
// http://103.134.238.50:91). That API returns phone/email directly per
// employee, so this no longer needs a separate CONTACT_API_BASE_URL.

const { sql, getPool } = require("../config/db");
const { normalizeEmployeeCode } = require("./attendanceService");
const { fetchAllEmployees } = require("./zkEmployeeService");

async function syncContactInfo() {
  try {
    const employees = await fetchAllEmployees();
    if (employees.length === 0) return;

    const pool = await getPool();
    let updated = 0;

    for (const emp of employees) {
      if (!emp.phone && !emp.email) continue;

      const code = normalizeEmployeeCode(emp.employeeCode);

      // Matches tms_users.enroll_no whether it was stored as "08" or "8" —
      // same normalization used everywhere else (attendance, directory).
      const result = await pool
        .request()
        .input("enrollNo", sql.NVarChar, code)
        .input("phone", sql.NVarChar, emp.phone || null)
        .input("contactEmail", sql.NVarChar, emp.email || null).query(`
          UPDATE tms_users
          SET phone = COALESCE(NULLIF(@phone, ''), phone),
              contact_email = COALESCE(NULLIF(@contactEmail, ''), contact_email)
          OUTPUT INSERTED.id
          WHERE enroll_no = @enrollNo
             OR CAST(TRY_CAST(enroll_no AS INT) AS NVARCHAR(50)) = @enrollNo
        `);

      if (result.recordset.length > 0) updated++;
    }

    if (updated > 0) {
      console.log(
        `✅ Synced contact info for ${updated} user(s) from the HRM employees API`,
      );
    }
  } catch (err) {
    console.error("syncContactInfo failed:", err.message);
  }
}

function startContactSync() {
  syncContactInfo(); // once at startup
  setInterval(syncContactInfo, 30 * 60 * 1000);
}

module.exports = { syncContactInfo, startContactSync };
