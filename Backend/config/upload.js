const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Folder where the encrypted .sfs files are stored.
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Maximum size of one uploaded encrypted file (20 MB).
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// The multipart field name the frontend uses.
const UPLOAD_FIELD_NAME = "encryptedFile";

// Create the upload folder on startup so a fresh clone works immediately.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },

    // The client file name is never used on disk: it gets a random UUID.
    // This avoids path traversal and name collisions.
    filename: (req, file, cb) => {
        cb(null, `${crypto.randomUUID()}.sfs`);
    }
});

function fileFilter(req, file, cb) {
    // The extension check is only a first filter. The real check (the "SFS1"
    // header written by the browser) happens in middleware/validateEncryptedFile.js.
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (extension !== ".sfs") {
        const error = new Error("Only encrypted .sfs files are allowed.");
        error.status = 400;
        return cb(error);
    }

    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    }
});

module.exports = {
    upload,
    UPLOAD_DIR,
    MAX_FILE_SIZE,
    UPLOAD_FIELD_NAME
};
