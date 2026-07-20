const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const activityController = require("../controllers/activityController");

router.use(requireAuth);

router.get("/", activityController.getAllActivities);
router.get("/actions", activityController.getActionActivities);
router.put("/:id/read", activityController.markAsRead);
router.put("/read-all", activityController.markAllAsRead);

module.exports = router;