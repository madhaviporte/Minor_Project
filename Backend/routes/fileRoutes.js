const express = require("express");

const { upload } = require("../config/upload");
const validateEncryptedFile = require("../middleware/validateEncryptedFile");
const {
    uploadFile,
    listFiles,
    downloadFile,
    deleteFile
} = require("../controllers/fileController");

const router = express.Router();

// POST /api/files/upload  (multipart form-data, field name: encryptedFile)
router.post(
    "/upload",
    upload.single("encryptedFile"),
    validateEncryptedFile,
    uploadFile
);

// GET /api/files
router.get("/", listFiles);

// GET /api/files/:fileId  (downloads one stored encrypted file)
router.get("/:fileId", downloadFile);

// DELETE /api/files/:fileId  (deletes one stored encrypted file)
router.delete("/:fileId", deleteFile);

module.exports = router;
