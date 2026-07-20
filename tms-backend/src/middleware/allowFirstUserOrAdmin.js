const { sql, poolPromise } = require("../config/db");
const jwt = require("jsonwebtoken");

// Lets /auth/register through in exactly two cases:
//   1. tms_users table is empty (first-run bootstrap, no admin exists yet)
//   2. the caller sends a valid admin JWT
// Everything else gets 403'd before it ever reaches userController.register.
async function allowFirstUserOrAdmin(req, res, next) {
  try {
    const pool = await getPool();
    const countResult = await pool
      .request()
      .query("SELECT COUNT(*) AS count FROM tms_users");
    const userCount = countResult.recordset[0].count;

    if (userCount === 0) {
      // Bootstrap case — force role to admin regardless of what was sent,
      // since this is meant to create the very first admin account.
      req.body.role = "admin";
      return next();
    }

    // Not the first user anymore — require a valid admin token.
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(403).json({
        message: "Registration is admin-only. Log in as an admin to add users.",
      });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can register new users." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      message: "Registration is admin-only. Log in as an admin to add users.",
    });
  }
}

module.exports = { allowFirstUserOrAdmin };
