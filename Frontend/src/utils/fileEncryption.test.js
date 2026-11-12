/**
 * Tests for the browser encryption helpers.
 *
 * They run in Node (v20+) with the same Web Crypto API the browser uses:
 *   npm test
 */
import test from "node:test";
import assert from "node:assert/strict";

import { encryptFile, decryptFile, hasSfsHeader } from "./fileEncryption.js";

const PASSWORD = "correct horse battery staple";
const textDecoder = new TextDecoder();

function asSfsFile(bytes, name = "file.sfs") {
    return new File([bytes], name, { type: "application/octet-stream" });
}

// Every byte value 0-255, repeated. This is real binary data: it contains null
// bytes and byte sequences that are not valid UTF-8, so a text conversion
// anywhere in the pipeline would change it.
function makeBinaryBytes(size = 4096) {
    const bytes = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) {
        bytes[index] = index % 256;
    }
    return bytes;
}

// The old .sfs format: salt + iv + ciphertext, with no header.
async function encryptLegacyFormat(text, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );

    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(text))
    );

    const result = new Uint8Array(16 + 12 + ciphertext.length);
    result.set(salt, 0);
    result.set(iv, 16);
    result.set(ciphertext, 28);
    return result;
}

test("encrypts and decrypts a file with the original content and name", async () => {
    const originalText = "Secure File Storage test content\n".repeat(200);
    const originalFile = new File([originalText], "notes.txt");

    const encrypted = await encryptFile(originalFile, PASSWORD);

    assert.ok(encrypted.length > originalFile.size, "ciphertext should be larger");
    assert.equal(textDecoder.decode(encrypted.subarray(0, 4)), "SFS1");
    assert.equal(encrypted[4], 1, "format version");

    const { data, fileName } = await decryptFile(
        asSfsFile(encrypted, "notes.txt.sfs"),
        PASSWORD
    );

    assert.equal(textDecoder.decode(data), originalText);
    assert.equal(fileName, "notes.txt");
});

test("encrypts and decrypts an empty file", async () => {
    const encrypted = await encryptFile(new File([], "empty.txt"), PASSWORD);
    const { data } = await decryptFile(asSfsFile(encrypted), PASSWORD);

    assert.equal(data.byteLength, 0);
});

test("round-trips binary data byte for byte", async () => {
    const originalBytes = makeBinaryBytes(4096);
    const encrypted = await encryptFile(
        new File([originalBytes], "sample.bin"),
        PASSWORD
    );

    const { data, fileName } = await decryptFile(
        asSfsFile(encrypted, "sample.bin.sfs"),
        PASSWORD
    );

    assert.deepEqual(new Uint8Array(data), originalBytes);
    assert.equal(fileName, "sample.bin");
});

test("keeps original names and bytes for common file types", async () => {
    const names = [
        "report.pdf",
        "thesis.docx",
        "marks.xlsx",
        "photo.png",
        "song.mp3",
        "clip.mp4",
        "data.csv",
        "plain.txt"
    ];

    for (const name of names) {
        const originalBytes = makeBinaryBytes(3072);
        const encrypted = await encryptFile(
            new File([originalBytes], name),
            PASSWORD
        );
        const { data, fileName } = await decryptFile(
            asSfsFile(encrypted, `${name}.sfs`),
            PASSWORD
        );

        assert.equal(fileName, name, `original name kept for ${name}`);
        assert.deepEqual(
            new Uint8Array(data),
            originalBytes,
            `bytes kept for ${name}`
        );
    }
});

test("preserves real file signatures (PDF, PNG, DOCX, MP4)", async () => {
    const signatures = {
        // "%PDF-1.7"
        "report.pdf": [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37],
        // PNG magic bytes
        "photo.png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
        // ZIP container, which is what a .docx really is
        "thesis.docx": [0x50, 0x4b, 0x03, 0x04],
        // MP4 "ftyp" box header
        "clip.mp4": [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]
    };

    for (const [name, signature] of Object.entries(signatures)) {
        const originalBytes = new Uint8Array([
            ...signature,
            ...makeBinaryBytes(1024)
        ]);

        const encrypted = await encryptFile(new File([originalBytes], name), PASSWORD);
        const { data } = await decryptFile(
            asSfsFile(encrypted, `${name}.sfs`),
            PASSWORD
        );

        const recovered = new Uint8Array(data);
        assert.deepEqual(
            Array.from(recovered.subarray(0, signature.length)),
            signature,
            `file signature kept for ${name}`
        );
        assert.deepEqual(recovered, originalBytes, `content kept for ${name}`);
    }
});

test("never stores the plaintext in the .sfs file", async () => {
    const secret = "EXAM ANSWER KEY - TOP SECRET";
    const encrypted = await encryptFile(new File([secret], "secret.txt"), PASSWORD);

    assert.equal(textDecoder.decode(encrypted).includes(secret), false);
});

test("detects the .sfs header and rejects files without it", async () => {
    const encrypted = await encryptFile(new File(["data"], "a.txt"), PASSWORD);

    assert.equal(await hasSfsHeader(asSfsFile(encrypted)), true);
    assert.equal(await hasSfsHeader(new File(["plain text"], "plain.txt")), false);
    assert.equal(await hasSfsHeader(new File(["SFS1 fake"], "fake.sfs")), false);
});

test("fails with a clear error when the password is wrong", async () => {
    const encrypted = await encryptFile(new File(["secret data"], "a.txt"), PASSWORD);

    await assert.rejects(
        () => decryptFile(asSfsFile(encrypted), "wrong password"),
        /Wrong password/
    );
});

test("fails when the encrypted bytes were modified", async () => {
    const encrypted = await encryptFile(new File(["secret data"], "a.txt"), PASSWORD);
    const tampered = new Uint8Array(encrypted);
    tampered[tampered.length - 1] ^= 0xff;

    await assert.rejects(
        () => decryptFile(asSfsFile(tampered), PASSWORD),
        /Wrong password/
    );
});

test("fails when the stored original file name was modified", async () => {
    const encrypted = await encryptFile(new File(["data"], "report.txt"), PASSWORD);
    const tampered = new Uint8Array(encrypted);
    // Byte 7 is the first byte of the stored original file name ("r" of report.txt).
    tampered[7] = 0x58; // "X"

    await assert.rejects(
        () => decryptFile(asSfsFile(tampered), PASSWORD),
        /Wrong password/
    );
});

test("rejects files that are too small to be valid", async () => {
    await assert.rejects(
        () => decryptFile(new File([new Uint8Array(20)], "tiny.sfs"), PASSWORD),
        /not a valid/
    );
});

test("still decrypts files created by the previous format", async () => {
    const legacy = await encryptLegacyFormat("old data", PASSWORD);

    const { data, fileName } = await decryptFile(
        asSfsFile(legacy, "old.sfs"),
        PASSWORD
    );

    assert.equal(textDecoder.decode(data), "old data");
    assert.equal(fileName, null);
});
