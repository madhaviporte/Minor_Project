const fs = require("fs/promises");

const {
    FIXED_HEADER_SIZE,
    MIN_ENCRYPTED_FILE_SIZE,
    hasValidSfsHeader
} = require("../utils/sfsFormat");

/**
 * Read the first bytes of an uploaded file and confirm it is really an .sfs
 * file written by our frontend.
 *
 * A file extension proves nothing, so an invalid upload is deleted here and
 * never becomes part of the stored files.
 */
async function isEncryptedFile(filePath, size) {
    if (size < MIN_ENCRYPTED_FILE_SIZE) {
        return false;
    }

    const handle = await fs.open(filePath, "r");
    try {
        const header = Buffer.alloc(FIXED_HEADER_SIZE);
        const { bytesRead } = await handle.read(header, 0, FIXED_HEADER_SIZE, 0);

        if (bytesRead !== FIXED_HEADER_SIZE) {
            return false;
        }

        return hasValidSfsHeader(header);
    } finally {
        await handle.close();
    }
}

module.exports = async function validateEncryptedFile(req, res, next) {
    if (!req.file) {
        return next();
    }

    let valid = false;

    try {
        valid = await isEncryptedFile(req.file.path, req.file.size);
    } catch (error) {
        valid = false;
    }

    if (!valid) {
        // Multer already saved the file, so remove it again.
        await fs.unlink(req.file.path).catch(() => {});

        return res.status(400).json({
            message:
                "The uploaded file is not a valid encrypted .sfs file. Encrypt it with this app before uploading."
        });
    }

    next();
};
