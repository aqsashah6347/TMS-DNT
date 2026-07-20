const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { uploadChatFile } = require("../controllers/uploadController");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "uploads", "chat"),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

router.use(requireAuth);
router.post("/chat", upload.single("file"), uploadChatFile);

module.exports = router;
