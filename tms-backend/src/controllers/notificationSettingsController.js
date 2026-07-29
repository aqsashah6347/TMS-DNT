// tms-backend/src/controllers/notificationSettingsController.js
const { sql, getPool } = require("../config/db");
const notificationSettingsService = require("../services/notificationSettingsService");
const { normalizeEmployeeCode } = require("../services/attendanceService");
const { fetchAllEmployees } = require("../services/zkEmployeeService");

// GET /api/notification-settings
// -> { settings: [{ id, type, channel, enabled, subjectTemplate, bodyTemplate, updatedAt }] }
async function listSettings(req, res, next) {
  try {
    const settings = await notificationSettingsService.getAllSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

// PUT /api/notification-settings/:id  body: { enabled, subjectTemplate, bodyTemplate }
// -> { settings: [...] }  (full updated list, so the UI can just replace state)
async function updateSettingHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { enabled, subjectTemplate, bodyTemplate } = req.body;

    await notificationSettingsService.updateSetting(Number(id), {
      enabled,
      subjectTemplate,
      bodyTemplate,
      updatedBy: req.user.id,
    });

    const settings = await notificationSettingsService.getAllSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

// GET /api/notification-settings/log?channel=&type=&status=&page=&pageSize=
// -> { logs: [...], total, page, pageSize }
async function getLog(req, res, next) {
  try {
    const { channel, type, status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Number(req.query.pageSize) || 50);
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (channel) conditions.push("l.channel = @channel");
    if (type) conditions.push("l.type = @type");
    if (status) conditions.push("l.status = @status");
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const pool = await getPool();

    const buildRequest = () => {
      const request = pool.request();
      if (channel) request.input("channel", sql.NVarChar, channel);
      if (type) request.input("type", sql.NVarChar, type);
      if (status) request.input("status", sql.NVarChar, status);
      return request;
    };

    const logsResult = await buildRequest()
      .input("offset", sql.Int, offset)
      .input("pageSize", sql.Int, pageSize).query(`
        SELECT l.id, l.type, l.channel, l.status, l.recipient,
               l.message_preview AS messagePreview,
               l.log_date AS logDate, l.created_at AS createdAt,
               u.name AS userName, u.role AS userRole
        FROM tms_notification_log l
        LEFT JOIN tms_users u ON u.id = l.user_id
        ${where}
        ORDER BY l.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
      `);

    const countResult = await buildRequest().query(
      `SELECT COUNT(*) AS total FROM tms_notification_log l ${where}`,
    );

    res.json({
      logs: logsResult.recordset,
      total: countResult.recordset[0]?.total || 0,
      page,
      pageSize,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/notification-settings/contacts
// -> { contacts: [{ employeeCode, name, department, designation, email,
//                    phone, hasAccount, role }], total }
// Pulls live from the HRM employees API (email + phone come straight off
// that record) and cross-references tms_users for account/role info.
async function getContacts(req, res, next) {
  try {
    const pool = await getPool();
    const usersResult = await pool
      .request()
      .query(
        "SELECT id, enroll_no AS enrollNo, contact_email AS contactEmail, phone, role FROM tms_users",
      );

    const userByCode = new Map(
      usersResult.recordset
        .filter((u) => u.enrollNo)
        .map((u) => [normalizeEmployeeCode(u.enrollNo), u]),
    );

    let employees;
    try {
      employees = await fetchAllEmployees();
    } catch (err) {
      return res.status(502).json({
        message: "Could not reach the HRM employees API right now",
        detail: err.message,
      });
    }

    const contacts = employees
      .map((emp) => {
        const code = normalizeEmployeeCode(emp.employeeCode);
        const account = userByCode.get(code);
        return {
          employeeCode: emp.employeeCode,
          name: emp.fullName,
          department: emp.departmentName || "—",
          designation: emp.designationName || "—",
          email: emp.email || account?.contactEmail || null,
          phone: emp.phone || account?.phone || null,
          hasAccount: !!account,
          role: account?.role || null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ contacts, total: contacts.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSettings, updateSettingHandler, getLog, getContacts };
