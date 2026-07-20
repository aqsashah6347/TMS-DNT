const jwt = require("jsonwebtoken");

// Runs before any protected route. Reads "Authorization: Bearer <token>",
// checks it's a real token we issued, and attaches the user info to req.user
// so every controller after this can just read req.user.id / req.user.role.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    // This is exactly the case your axiosInstance.js interceptor is
    // watching for (401 -> logs the user out on the frontend).
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Use after requireAuth on routes only admins should reach,
// e.g. router.get("/users", requireAuth, requireRole("admin"), ...)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed to do that" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
