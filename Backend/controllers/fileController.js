const fs = require("fs/promises");
const path = require("path");

const { UPLOAD_DIR } = require("../config/upload");

/**
 * A stored file ID is a plain file name inside the uploads folder: one of our
 * random UUID names ending in ".sfs".
 *
 * The check below runs before anything touches the disk. It rejects slashes,
 * backslashes, "..", control characters and every other extension, so a value
 * such as "../server.js" can never be turned into a path.
 */
const FILE_ID_PATTERN = /^[A-Za-z0-9_-][A-Za-z0-9._-]*\.sfs$/;

function isSafeFileId(fileId) {
    return (
        typeof fileId === "string" &&
        fileId.length <= 120 &&
        !fileId.includes("..") &&
        FILE_ID_PATTERN.test(fileId)
    );
}

/**
 * Find one stored file by its ID.
 *
 * The ID from the URL is only ever *compared* with the names that already
 * exist in the uploads folder - it is never joined into a path directly.
 * Returns the full path of the file, or null when it is not stored there.
 */
async function findStoredFile(fileId) {
    if (!isSafeFileId(fileId)) {
        return null;
    }

    const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });

    const match = entries.find(
        (entry) =>
            entry.isFile() &&
            entry.name === fileId &&
            entry.name.toLowerCase().endsWith(".sfs")
    );

    return match ? path.join(UPLOAD_DIR, match.name) : null;
}

/**
 * POST /api/files/upload
 * Multer has already stored the file and validateEncryptedFile has already
 * checked its header, so this only builds the response.
 */
async function uploadFile(req, res) {
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
}

/**
 * GET /api/files
 * Lists the encrypted files in the uploads folder. Only the random file ID,
 * size and upload time are known to the server.
 */
async function listFiles(req, res, next) {
    try {
        const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });

        const fileNames = entries
            .filter(
                (entry) =>
                    entry.isFile() && entry.name.toLowerCase().endsWith(".sfs")
            )
            .map((entry) => entry.name);

        const files = await Promise.all(
            fileNames.map(async (fileName) => {
                const stats = await fs.stat(path.join(UPLOAD_DIR, fileName));

                // birthtime is not available on every filesystem, mtime is.
                const uploadedAt = stats.birthtimeMs ? stats.birthtime : stats.mtime;

                return {
                    fileId: fileName,
                    size: stats.size,
                    uploadedAt: uploadedAt.toISOString()
                };
            })
        );

        files.sort(
            (first, second) =>
                new Date(second.uploadedAt) - new Date(first.uploadedAt)
        );

        res.status(200).json({
            message: "Files fetched successfully!",
            count: files.length,
            files
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/files/:fileId
 * Sends one stored encrypted file back to the browser.
 */
async function downloadFile(req, res, next) {
    try {
        const filePath = await findStoredFile(req.params.fileId);

        if (!filePath) {
            return res.status(404).json({
                message: "File not found."
            });
        }

        const fileName = path.basename(filePath);

        // res.download sends the file as an attachment, so the browser saves
        // it instead of trying to display it.
        //
        // The headers are set explicitly because Express would guess the type
        // from the ".sfs" extension (application/vnd.spotfire.sfs). These files
        // are encrypted bytes, so they must be sent as a generic binary file.
        res.download(
            filePath,
            fileName,
            {
                headers: {
                    "Content-Type": "application/octet-stream",
                    "X-Content-Type-Options": "nosniff"
                }
            },
            (error) => {
                // A file that disappeared between readdir and download is a real
                // server error; a cancelled download is not.
                if (error && !res.headersSent) {
                    next(error);
                }
            }
        );
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/files/:fileId
 * Deletes one stored encrypted file from the uploads folder.
 *
 * Only a file that is really stored there can be deleted: the ID is validated
 * and then must match an existing ".sfs" entry exactly. There is no way to
 * reach another folder, and the server never deletes anything else.
 */
async function deleteFile(req, res, next) {
    try {
        const fileId = req.params.fileId;

        if (!isSafeFileId(fileId)) {
            return res.status(400).json({
                message: "Invalid file ID."
            });
        }

        const filePath = await findStoredFile(fileId);

        if (!filePath) {
            return res.status(404).json({
                message: "File not found."
            });
        }

        try {
            await fs.unlink(filePath);
        } catch (error) {
            // Someone else deleted it a moment ago - still a "not found".
            if (error.code === "ENOENT") {
                return res.status(404).json({
                    message: "File not found."
                });
            }

            throw error;
        }

        res.status(200).json({
            message: "Encrypted file deleted.",
            fileId
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { uploadFile, listFiles, downloadFile, deleteFile };
