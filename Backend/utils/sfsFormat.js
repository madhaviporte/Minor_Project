/**
 * Description of the browser-side .sfs file format.
 *
 * The browser writes this header before the encrypted bytes:
 *
 *   "SFS1" | version (1 byte) | name length (2 bytes, big-endian)
 *   | original file name (UTF-8) | salt (16) | iv (12) | ciphertext + GCM tag
 *
 * The server cannot decrypt anything, it only checks that an uploaded file
 * really starts with this header.
 *
 * Keep these values in sync with Frontend/src/utils/fileEncryption.js.
 */

const SFS_MAGIC = "SFS1";
const SFS_VERSION = 1;
const FIXED_HEADER_SIZE = 7;

const SALT_SIZE = 16;
const IV_SIZE = 12;
const GCM_TAG_SIZE = 16;
const MAX_FILE_NAME_BYTES = 255;

// Smallest possible valid file: header + salt + iv + empty payload + tag.
const MIN_ENCRYPTED_FILE_SIZE =
    FIXED_HEADER_SIZE + SALT_SIZE + IV_SIZE + GCM_TAG_SIZE;

/**
 * @param {Buffer} buffer first bytes of the uploaded file (7 bytes is enough)
 */
function hasValidSfsHeader(buffer) {
    if (!buffer || buffer.length < FIXED_HEADER_SIZE) {
        return false;
    }

    if (buffer.subarray(0, 4).toString("ascii") !== SFS_MAGIC) {
        return false;
    }

    if (buffer[4] !== SFS_VERSION) {
        return false;
    }

    const nameLength = buffer.readUInt16BE(5);
    return nameLength <= MAX_FILE_NAME_BYTES;
}

module.exports = {
    SFS_MAGIC,
    SFS_VERSION,
    FIXED_HEADER_SIZE,
    SALT_SIZE,
    IV_SIZE,
    GCM_TAG_SIZE,
    MAX_FILE_NAME_BYTES,
    MIN_ENCRYPTED_FILE_SIZE,
    hasValidSfsHeader
};
