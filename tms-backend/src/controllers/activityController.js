const { sql, poolPromise } = require("../config/db");
const { mapActivity, ACTION_TYPES } = require("../services/activityService");

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

// GET /api/activities/actions
// Powers Box 1 (Action Activity) specifically. Admins see every user's
// self-logged actions (create/edit/delete); everyone else sees only
// their own — same rows they always saw here.
async function getActionActivities(req, res, next) {
  try {
    const pool = await poolPromise;
    const isAdmin = req.user.role === "admin";
    const request = pool.request();

    const typeParams = ACTION_TYPES.map((_, i) => `@type${i}`).join(", ");
    ACTION_TYPES.forEach((t, i) => request.input(`type${i}`, sql.NVarChar, t));

    let query = `
      SELECT n.*, u.name AS actor_name
      FROM tms_notifications n
      JOIN tms_users u ON u.id = n.user_id
      WHERE n.type IN (${typeParams})
    `;

    if (!isAdmin) {
      request.input("userId", sql.Int, req.user.id);
      query += ` AND n.user_id = @userId`;
    }

    query += ` ORDER BY n.created_at DESC`;

    const result = await request.query(query);
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

module.exports = {
  getAllActivities,
  getActionActivities,
  markAsRead,
  markAllAsRead,
};