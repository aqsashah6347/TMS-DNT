// tms-backend/src/services/notificationSettingsService.js
const { sql, getPool } = require("../config/db");

const TYPES = ["task_assigned", "deadline_24h", "progress_reminder"];
const CHANNELS = ["email", "whatsapp"];

async function getAllSettings() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT id, type, channel, enabled, subject_template AS subjectTemplate,
              body_template AS bodyTemplate, updated_at AS updatedAt
       FROM tms_notification_settings ORDER BY type, channel`,
  );
  return result.recordset;
}

async function getSetting(type, channel) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("type", sql.NVarChar, type)
    .input("channel", sql.NVarChar, channel)
    .query(
      `SELECT TOP 1 id, type, channel, enabled, subject_template, body_template
       FROM tms_notification_settings WHERE type = @type AND channel = @channel`,
    );
  return result.recordset[0] || null;
}

async function updateSetting(
  id,
  { enabled, subjectTemplate, bodyTemplate, updatedBy },
) {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.Int, id)
    .input("enabled", sql.Bit, enabled ? 1 : 0)
    .input("subject", sql.NVarChar(255), subjectTemplate || null)
    .input("body", sql.NVarChar(sql.MAX), bodyTemplate || "")
    .input("updatedBy", sql.Int, updatedBy || null).query(`
      UPDATE tms_notification_settings
      SET enabled = @enabled,
          subject_template = @subject,
          body_template = @body,
          updated_by = @updatedBy,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id
    `);
}

// Simple {{variable}} substitution — no loops/conditionals, keeps the
// templates safely editable from the admin UI without a templating engine.
function renderTemplate(template, vars) {
  if (!template) return "";
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(vars, key)
      ? String(vars[key] ?? "")
      : "",
  );
}

module.exports = {
  TYPES,
  CHANNELS,
  getAllSettings,
  getSetting,
  updateSetting,
  renderTemplate,
};
