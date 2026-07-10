require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorHandler = require("./src/middleware/errorHandler");

const authRoutes = require("./src/routes/authRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const teamRoutes = require("./src/routes/teamRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const userRoutes = require("./src/routes/userRoutes");
const permissionRoutes = require("./src/routes/permissionRoutes");
const app = express();

// Allows your React app (running on a different port) to call this API.
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/api/permissions", permissionRoutes);
// Quick way to check the server is alive: visit http://localhost:5000/api/health
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

// Must be registered LAST — Express only reaches this if nothing above
// handled the request or something threw an error.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 TMS backend running on http://localhost:${PORT}`);
});
