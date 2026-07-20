const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sql, getPool } = require("../config/db");
const { fetchAllEmployees } = require("./zkEmployeeService");

async function provisionUser(pool, employee) {
  const randomHash = await bcrypt.hash(
    crypto.randomBytes(20).toString("hex"),
    10,
  );

  const inserted = await pool
    .request()
    .input("name", sql.NVarChar, employee.fullName)
    .input("email", sql.NVarChar, `${employee.employeeCode}@dnt.local`)
    .input("passwordHash", sql.NVarChar, randomHash)
    .input("enrollNo", sql.NVarChar, employee.employeeCode).query(`
      INSERT INTO tms_users (name, email, password_hash, enroll_no)
      OUTPUT INSERTED.*
      VALUES (@name, @email, @passwordHash, @enrollNo)
    `);

  return inserted.recordset[0];
}

async function syncAllEmployeesToUsers() {
  try {
    const pool = await getPool();
    const employees = await fetchAllEmployees();

    const existing = await pool
      .request()
      .query("SELECT enroll_no FROM tms_users WHERE enroll_no IS NOT NULL");
    const knownCodes = new Set(existing.recordset.map((r) => r.enroll_no));

    let createdCount = 0;
    for (const employee of employees) {
      if (!employee.employeeCode || knownCodes.has(employee.employeeCode))
        continue;
      await provisionUser(pool, employee);
      createdCount++;
    }

    if (createdCount > 0) {
      console.log(
        `✅ Auto-provisioned ${createdCount} employee account(s) from the HRM roster`,
      );
    }
  } catch (err) {
    console.error("syncAllEmployeesToUsers failed:", err.message);
  }
}

function startEmployeeSync() {
  syncAllEmployeesToUsers(); // once at startup
  setInterval(syncAllEmployeesToUsers, 30 * 60 * 1000); // then every 30 minutes
}

module.exports = { syncAllEmployeesToUsers, startEmployeeSync };
