const { sql, poolPromise } = require("../config/db");
const { mapActivity } = require("../services/activityService");

// GET /api/activities
async function getAllActivities(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("userId", sql.Int, req.user.id)
      .query(`
        SELECT * FROM tms_notifications
        WHERE user_id = @userId
        ORDER BY created_at DESC
      `);

    res.json(result.recordset.map(mapActivity));
  } catch (err) {
    next(err);
  }
}

// PUT /api/activities/:id/read
async function markAsRead(req, res, next) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("userId", sql.Int, req.user.id).query(`
        UPDATE tms_notifications SET is_read = 1
        OUTPUT INSERTED.*
        WHERE id = @id AND user_id = @userId
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Activity not found" });
    res.json(mapActivity(result.recordset[0]));
  } catch (err) {
    next(err);
  }
}

// PUT /api/activities/read-all
async function markAllAsRead(req, res, next) {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .query(
        "UPDATE tms_notifications SET is_read = 1 WHERE user_id = @userId AND is_read = 0",
      );

    res.json({ message: "All activities marked as read" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllActivities, markAsRead, markAllAsRead };
