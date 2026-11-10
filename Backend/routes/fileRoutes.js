
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();

// Folder where encrypted files will be stored
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        cb(null, crypto.randomUUID() + ".sfs");
    }
});

// Configure upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== ".sfs") {
            return cb(new Error("Only encrypted files are allowed."));
        }

        cb(null, true);
    }
});

// Upload encrypted file
router.post("/upload", upload.single("encryptedFile"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "Please select an encrypted file."
        });
    }

    res.status(201).json({
        message: "Encrypted file uploaded successfully!",
        fileId: req.file.filename,
        size: req.file.size
    });
});

// Get all uploaded encrypted files
router.get("/", (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir);

        const fileList = files
            .filter((file) => file.endsWith(".sfs"))
            .map((file) => {
                const filePath = path.join(uploadDir, file);
                const stats = fs.statSync(filePath);

                return {
                    fileId: file,
                    size: stats.size,
                    uploadedAt: stats.birthtime
                };
            });

        res.status(200).json({
            message: "Files fetched successfully!",
            files: fileList
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch files."
        });
    }
});

module.exports = router;
