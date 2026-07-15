// multer (see uploadRoutes.js) already wrote the file to disk — this just
// reports back where the client can reach it.
function uploadChatFile(req, res) {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  res.status(201).json({
    url: `/uploads/chat/${req.file.filename}`,
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
  });
}

module.exports = { uploadChatFile };
