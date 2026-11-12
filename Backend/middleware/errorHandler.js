const multer = require("multer");

const { MAX_FILE_SIZE } = require("../config/upload");

/**
 * 404 handler for unknown routes, so the API always answers with JSON.
 */
function notFound(req, res) {
    res.status(404).json({
        message: "Route not found."
    });
}

/**
 * Central error handler. Without this, Multer and other errors would return an
 * HTML error page that the React app cannot parse.
 */
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                message: `File is too large. Maximum size is ${Math.round(
                    MAX_FILE_SIZE / (1024 * 1024)
                )} MB.`
            });
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                message: "Unexpected file field. Use the field name \"encryptedFile\"."
            });
        }

        return res.status(400).json({
            message: `Upload failed: ${err.message}`
        });
    }

    // Errors raised by our own middleware/validation with a known client status.
    if (err.status && err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({ message: err.message });
    }

    // Never log request bodies or file contents, only the error message.
    console.error("Unexpected server error:", err.message);

    res.status(500).json({
        message: "Something went wrong on the server."
    });
}

module.exports = { notFound, errorHandler };
