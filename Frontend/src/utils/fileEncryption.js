/**
 * File encryption for Secure File Storage.
 *
 * Everything here runs in the browser with the Web Crypto API, so the password
 * and the encryption key never leave the user's device.
 *
 * .sfs file layout (version 1):
 *
 *   "SFS1" | version (1 byte) | name length (2 bytes, big-endian)
 *   | original file name (UTF-8) | salt (16 bytes) | iv (12 bytes)
 *   | AES-256-GCM ciphertext + 16 byte authentication tag
 *
 * The header (everything before the salt) is passed to AES-GCM as
 * `additionalData`, so changing the stored file name or version makes
 * decryption fail instead of silently producing a wrong result.
 *
 * Files created by the previous version of this project had no header at all
 * (salt + iv + ciphertext only). They can still be decrypted; see readHeader().
 */

const PBKDF2_ITERATIONS = 310000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const GCM_TAG_LENGTH_BITS = 128;

const MAGIC = "SFS1";
const FORMAT_VERSION = 1;
const FIXED_HEADER_LENGTH = 7; // "SFS1" + version byte + 2 byte name length
const MAX_FILE_NAME_BYTES = 255;
const MIN_FILE_LENGTH =
    FIXED_HEADER_LENGTH + SALT_LENGTH + IV_LENGTH + GCM_TAG_LENGTH;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Turn a password into a non-extractable AES-256-GCM key.
 * A new random salt must be used for every file.
 */
async function deriveKey(password, salt) {
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        textEncoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256"
        },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Build the authenticated header that is stored at the start of every file.
 */
function buildHeader(fileName) {
    // Keep only the base name: no folder paths inside our file format.
    const safeName = String(fileName || "file").split(/[\\/]/).pop();
    const nameBytes = textEncoder.encode(safeName);

    if (nameBytes.length > MAX_FILE_NAME_BYTES) {
        throw new Error("File name is too long to store inside the encrypted file.");
    }

    const header = new Uint8Array(FIXED_HEADER_LENGTH + nameBytes.length);
    header.set(textEncoder.encode(MAGIC), 0);
    header[FIXED_HEADER_LENGTH - 3] = FORMAT_VERSION;
    new DataView(header.buffer).setUint16(
        FIXED_HEADER_LENGTH - 2,
        nameBytes.length,
        false
    );
    header.set(nameBytes, FIXED_HEADER_LENGTH);

    return header;
}

/**
 * Read the header of an encrypted file.
 *
 * Returns null for the old header-less format, and throws for a file that has
 * our magic bytes but an invalid version or a truncated name section.
 */
function readHeader(bytes) {
    if (bytes.length < 4) {
        return null;
    }

    const magic = textDecoder.decode(bytes.subarray(0, 4));
    if (magic !== MAGIC) {
        return null; // old format, or not an .sfs file at all
    }

    if (bytes.length < FIXED_HEADER_LENGTH) {
        throw new Error("This encrypted file is incomplete.");
    }

    const version = bytes[4];
    if (version !== FORMAT_VERSION) {
        throw new Error(`Unsupported encrypted file version (${version}).`);
    }

    const nameLength = (bytes[5] << 8) | bytes[6];
    if (
        nameLength > MAX_FILE_NAME_BYTES ||
        bytes.length <
            FIXED_HEADER_LENGTH +
                nameLength +
                SALT_LENGTH +
                IV_LENGTH +
                GCM_TAG_LENGTH
    ) {
        throw new Error("This encrypted file is corrupted or truncated.");
    }

    const fileName = textDecoder.decode(
        bytes.subarray(FIXED_HEADER_LENGTH, FIXED_HEADER_LENGTH + nameLength)
    );

    return { fileName: fileName || null, headerLength: FIXED_HEADER_LENGTH + nameLength };
}

/**
 * Encrypt a File/Blob and return the bytes of the .sfs file.
 */
export async function encryptFile(file, password) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const header = buildHeader(file.name);

    const key = await deriveKey(password, salt);
    const fileData = await file.arrayBuffer();

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv,
            additionalData: header,
            tagLength: GCM_TAG_LENGTH_BITS
        },
        key,
        fileData
    );

    const result = new Uint8Array(
        header.length + SALT_LENGTH + IV_LENGTH + encryptedData.byteLength
    );

    let offset = 0;
    result.set(header, offset);
    offset += header.length;
    result.set(salt, offset);
    offset += salt.length;
    result.set(iv, offset);
    offset += iv.length;
    result.set(new Uint8Array(encryptedData), offset);

    return result;
}

/**
 * Decrypt a .sfs file.
 *
 * Returns { data, fileName } where `fileName` is the original name stored by
 * encryptFile() (null for files created by the old format).
 * AES-GCM authentication makes a wrong password or a modified file fail here
 * instead of producing garbage.
 */
export async function decryptFile(encryptedFile, password) {
    const bytes = new Uint8Array(await encryptedFile.arrayBuffer());

    const header = readHeader(bytes);
    const headerLength = header ? header.headerLength : 0;

    if (bytes.length < headerLength + SALT_LENGTH + IV_LENGTH + GCM_TAG_LENGTH) {
        throw new Error(
            "This file is not a valid .sfs encrypted file (it is too small)."
        );
    }

    const salt = bytes.slice(headerLength, headerLength + SALT_LENGTH);
    const iv = bytes.slice(
        headerLength + SALT_LENGTH,
        headerLength + SALT_LENGTH + IV_LENGTH
    );
    const encryptedData = bytes.slice(headerLength + SALT_LENGTH + IV_LENGTH);

    const key = await deriveKey(password, salt);

    const algorithm = {
        name: "AES-GCM",
        iv,
        tagLength: GCM_TAG_LENGTH_BITS
    };
    if (header) {
        algorithm.additionalData = bytes.slice(0, headerLength);
    }

    let decryptedData;
    try {
        decryptedData = await crypto.subtle.decrypt(algorithm, key, encryptedData);
    } catch {
        throw new Error(
            "Wrong password, or the encrypted file has been modified."
        );
    }

    return {
        data: decryptedData,
        fileName: header ? header.fileName : null
    };
}

/**
 * Cheap sanity check used before uploading: does this file start with our
 * header and is it long enough to contain salt, IV and authentication tag?
 * This is not proof of anything secret, it only rejects obvious junk early.
 */
export async function hasSfsHeader(file) {
    if (!file || file.size < MIN_FILE_LENGTH) {
        return false;
    }

    const head = new Uint8Array(
        await file.slice(0, FIXED_HEADER_LENGTH).arrayBuffer()
    );

    if (head.length < FIXED_HEADER_LENGTH) {
        return false;
    }
    if (textDecoder.decode(head.subarray(0, 4)) !== MAGIC) {
        return false;
    }
    if (head[4] !== FORMAT_VERSION) {
        return false;
    }

    const nameLength = (head[5] << 8) | head[6];
    return file.size >= FIXED_HEADER_LENGTH + nameLength + SALT_LENGTH + IV_LENGTH + GCM_TAG_LENGTH;
}
