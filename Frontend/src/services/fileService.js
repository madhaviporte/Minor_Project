/**
 * All communication with the backend lives here.
 *
 * The backend address is configurable through an optional .env file:
 *   VITE_API_URL=http://localhost:3000
 */
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
);

// Must match the limit configured in Backend/config/upload.js
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/**
 * Make a request and always try to read a JSON reply.
 * The backend uses JSON for every response (including errors), so a non-JSON
 * reply usually means the server is not running or a proxy returned an error.
 */
async function requestJson(url, options) {
    let response;

    try {
        response = await fetch(url, options);
    } catch {
        throw new Error(`Cannot reach the backend at ${API_URL}. Is it running?`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        throw new Error(
            `Unexpected server response (HTTP ${response.status}).`
        );
    }

    const body = await response.json();

    if (!response.ok) {
        throw new Error(body.message || `Request failed (HTTP ${response.status}).`);
    }

    return body;
}

/**
 * Upload one encrypted .sfs file.
 * Only encrypted bytes are sent - the password and key stay in the browser.
 */
export async function uploadEncryptedFile(file) {
    const formData = new FormData();
    // The field name must match upload.single("encryptedFile") on the server.
    formData.append("encryptedFile", file, file.name);

    return requestJson(`${API_URL}/api/files/upload`, {
        method: "POST",
        body: formData
    });
}

/**
 * Fetch the list of stored encrypted files.
 */
export async function getStoredFiles() {
    const body = await requestJson(`${API_URL}/api/files`);
    return Array.isArray(body.files) ? body.files : [];
}

/**
 * Download one stored encrypted file.
 * The reply is the raw .sfs bytes, not JSON, so this does not use requestJson.
 */
export async function downloadStoredFile(fileId) {
    const url = `${API_URL}/api/files/${encodeURIComponent(fileId)}`;

    let response;

    try {
        response = await fetch(url);
    } catch {
        throw new Error(`Cannot reach the backend at ${API_URL}. Is it running?`);
    }

    // Errors from the backend are JSON (for example "File not found.").
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || contentType.includes("application/json")) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
            body.message || `Download failed (HTTP ${response.status}).`
        );
    }

    return response.blob();
}

/**
 * Delete one stored encrypted file from the server.
 * This removes the file only - nothing is sent back to the browser.
 */
export async function deleteStoredFile(fileId) {
    return requestJson(`${API_URL}/api/files/${encodeURIComponent(fileId)}`, {
        method: "DELETE"
    });
}

export { API_URL, MAX_UPLOAD_BYTES };
