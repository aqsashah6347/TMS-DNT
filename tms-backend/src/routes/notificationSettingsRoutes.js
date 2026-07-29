// tms-backend/src/routes/notificationSettingsRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/notificationSettingsController");

// Everything here is admin-only — editable message content, the send
// log, and everyone's contact info all live behind this.
router.use(requireAuth, requireRole("admin"));

router.get("/", controller.listSettings);
router.put("/:id", controller.updateSettingHandler);
router.get("/log", controller.getLog);
router.get("/contacts", controller.getContacts);

module.exports = router;
