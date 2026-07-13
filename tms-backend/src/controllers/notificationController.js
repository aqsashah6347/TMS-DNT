const { sql, poolPromise } = require("../config/db");

async function getAllNotifications(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .query(`
        SELECT * FROM tms_notifications
        WHERE user_id = @userId
        ORDER BY created_at DESC
      `);

    res.json(result.recordset.map(mapNotification));
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("userId", sql.Int, req.user.id)
      .query(`
        UPDATE tms_notifications SET is_read = 1
        OUTPUT INSERTED.*
        WHERE id = @id AND user_id = @userId
      `);

    if (result.recordset.length === 0) return res.status(404).json({ message: "Notification not found" });
    res.json(mapNotification(result.recordset[0]));
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .query("UPDATE tms_notifications SET is_read = 1 WHERE user_id = @userId");

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
}

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    relatedEntity: row.related_entity,
    relatedId: row.related_id,
    read: row.is_read,
    time: row.created_at,
  };
}

module.exports = { getAllNotifications, markAsRead, markAllAsRead };
