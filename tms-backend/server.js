require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const errorHandler = require("./src/middleware/errorHandler");
const { initSocket } = require("./src/config/socket");
const path = require("path");
const fs = require("fs");
const uploadRoutes = require("./src/routes/uploadRoutes");

const authRoutes = require("./src/routes/authRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const teamRoutes = require("./src/routes/teamRoutes");
const activityRoutes = require("./src/routes/activityRoutes");
const {
  startMissedDeadlineChecker,
} = require("./src/utils/missedDeadlineChecker");

const userRoutes = require("./src/routes/userRoutes");
const permissionRoutes = require("./src/routes/permissionRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");
const employeesRoutes = require("./src/routes/employeesRoutes");
const { checkZkTokenExpiry } = require("./src/utils/checkZkTokenExpiry");
const { startEmployeeSync } = require("./src/services/userProvisioningService");
const app = express();

// Allows your React app (running on a different port) to call this API.
fs.mkdirSync(path.join(__dirname, "uploads", "chat"), { recursive: true });

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/upload", uploadRoutes);

app.use(express.json());
app.use("/api/permissions", permissionRoutes);
app.use("/api/attendance", attendanceRoutes);

// Quick way to check the server is alive: visit http://localhost:5000/api/health
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/employees", employeesRoutes);

// Must be registered LAST — Express only reaches this if nothing above
// handled the request or something threw an error.
app.use(errorHandler);

// socket.io needs the raw http server (not the express app) so it can
// upgrade HTTP connections to websockets.
const httpServer = http.createServer(app);
initSocket(httpServer);
startEmployeeSync();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 TMS backend running on http://localhost:${PORT}`);
  checkZkTokenExpiry();
});