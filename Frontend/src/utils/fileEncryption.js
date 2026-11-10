
const ITERATIONS = 310000;

// Convert password into an AES-256 key
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();

    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: ITERATIONS,
            hash: "SHA-256"
        },
        passwordKey,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );
}

// Encrypt a file
export async function encryptFile(file, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(password, salt);
    const fileData = await file.arrayBuffer();

    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        fileData
    );

    // Store salt + IV + encrypted data together
    const result = new Uint8Array(
        salt.length + iv.length + encryptedData.byteLength
    );

    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encryptedData), salt.length + iv.length);

    return result;
}

// Decrypt an encrypted file
export async function decryptFile(encryptedFile, password) {
    const data = new Uint8Array(await encryptedFile.arrayBuffer());

    if (data.length < 44) {
        throw new Error("Invalid encrypted file.");
    }

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encryptedData = data.slice(28);

    const key = await deriveKey(password, salt);

    return crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedData
    );
}
