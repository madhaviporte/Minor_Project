import { useEffect, useState } from "react";

import FileSelector from "./components/FileSelector";
import PasswordInput from "./components/PasswordInput";
import FileActions from "./components/FileActions";
import StoredFiles from "./components/StoredFiles";
import ThemeToggle from "./components/ThemeToggle";
import Icon from "./components/Icon";

import { encryptFile, decryptFile, hasSfsHeader } from "./utils/fileEncryption";
import { downloadFile } from "./utils/downloadFile";
import { formatFileSize } from "./utils/formatFileSize";
import {
    uploadEncryptedFile,
    getStoredFiles,
    downloadStoredFile,
    deleteStoredFile,
    MAX_UPLOAD_BYTES
} from "./services/fileService";

const MIN_PASSWORD_LENGTH = 8;
const MAX_FILE_SIZE_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

function App() {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState("");

    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("info");
    const [busy, setBusy] = useState(false);

    const [storedFiles, setStoredFiles] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState("");
    const [downloadingId, setDownloadingId] = useState("");
    const [deletingId, setDeletingId] = useState("");

    function showStatus(message, type = "info") {
        setStatusMessage(message);
        setStatusType(type);
    }

    // Initial load of the stored file list. State is updated only from the
    // promise callbacks (not synchronously inside the effect).
    useEffect(() => {
        let active = true;

        getStoredFiles()
            .then((files) => {
                if (!active) return;
                setStoredFiles(files);
                setListError("");
            })
            .catch((error) => {
                if (active) setListError(error.message);
            })
            .finally(() => {
                if (active) setListLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    // Also used by the refresh button, and after an upload or a delete.
    async function refreshStoredFiles() {
        setListLoading(true);
        setListError("");

        try {
            setStoredFiles(await getStoredFiles());
        } catch (error) {
            setListError(error.message);
        } finally {
            setListLoading(false);
        }
    }

    function handleFileChange(selectedFile) {
        if (!selectedFile) {
            setFile(null);
            return;
        }

        // The encrypted copy is slightly bigger than the original, and the
        // server refuses anything over 20 MB, so reject it here with a clear
        // message instead of failing later during upload.
        if (selectedFile.size > MAX_UPLOAD_BYTES) {
            setFile(null);
            showStatus(
                `"${selectedFile.name}" is ${formatFileSize(
                    selectedFile.size
                )}. The maximum file size is ${MAX_FILE_SIZE_MB} MB.`,
                "error"
            );
            return;
        }

        setFile(selectedFile);
        showStatus("");
    }

    function handleClearFile() {
        setFile(null);
        showStatus("");
    }

    /**
     * Check the inputs shared by both encrypt actions.
     * Returns true when encryption can start.
     */
    function canEncrypt() {
        if (!file) {
            showStatus("Please select a file to encrypt.", "error");
            return false;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            showStatus(
                `Please use a password with at least ${MIN_PASSWORD_LENGTH} characters.`,
                "error"
            );
            return false;
        }

        return true;
    }

    /**
     * Main workflow: encrypt in the browser, then upload the encrypted bytes
     * straight away. The original file and the password are never sent - only
     * the .sfs result leaves the page.
     */
    async function handleEncryptAndUpload() {
        if (busy || !canEncrypt()) return;

        setBusy(true);
        showStatus("Encrypting the file in your browser...", "info");

        try {
            const encryptedBytes = await encryptFile(file, password);

            // A file right at 20 MB produces a slightly bigger .sfs file,
            // which the server would refuse. Say so instead of failing later.
            if (encryptedBytes.length > MAX_UPLOAD_BYTES) {
                showStatus(
                    `Encrypted, but the encrypted copy is ${formatFileSize(
                        encryptedBytes.length
                    )} - just over the ${MAX_FILE_SIZE_MB} MB upload limit, so it was not uploaded. Try a slightly smaller file.`,
                    "error"
                );
                return;
            }

            const encryptedFile = new File(
                [encryptedBytes],
                `${file.name}.sfs`,
                { type: "application/octet-stream" }
            );

            showStatus("Uploading the encrypted file...", "info");
            const result = await uploadEncryptedFile(encryptedFile);

            // Only the encrypted copy was ever sent to the server, so the
            // form can be reset for the next file.
            setFile(null);
            setPassword("");

            showStatus(
                `Encrypted in your browser and stored as ${result.fileId}. The server received only encrypted bytes - never your file or your password.`,
                "success"
            );

            await refreshStoredFiles();
        } catch (error) {
            showStatus(`Encrypt & upload failed: ${error.message}`, "error");
        } finally {
            setBusy(false);
        }
    }

    /**
     * Optional action: encrypt and save the .sfs file instead of uploading it.
     */
    async function handleEncryptAndDownload() {
        if (busy || !canEncrypt()) return;

        setBusy(true);
        showStatus("Encrypting file in your browser...", "info");

        try {
            const encryptedBytes = await encryptFile(file, password);
            const encryptedFileName = `${file.name}.sfs`;

            downloadFile(encryptedBytes, encryptedFileName);

            // Select the encrypted file so it can be decrypted or uploaded
            // without picking it again, and so the plaintext is never uploaded
            // by mistake.
            setFile(
                new File([encryptedBytes], encryptedFileName, {
                    type: "application/octet-stream"
                })
            );

            showStatus(
                `Encrypted and downloaded as ${encryptedFileName}. You can decrypt it with the same password, or upload it to the server.`,
                "success"
            );
        } catch (error) {
            showStatus(`Encryption failed: ${error.message}`, "error");
        } finally {
            setBusy(false);
        }
    }

    async function handleDecrypt() {
        if (busy) return;

        if (!file) {
            showStatus("Please select an encrypted .sfs file.", "error");
            return;
        }

        if (!file.name.toLowerCase().endsWith(".sfs")) {
            showStatus(
                "Please select a file with the .sfs extension. It is the encrypted file created by this app.",
                "error"
            );
            return;
        }

        if (!password) {
            showStatus("Please enter the password used to encrypt this file.", "error");
            return;
        }

        setBusy(true);
        showStatus("Decrypting file in your browser...", "info");

        try {
            const { data, fileName } = await decryptFile(file, password);

            // New files store their original name inside the encrypted header.
            // Files from the old format fall back to removing the .sfs suffix.
            const originalName =
                fileName || file.name.replace(/\.sfs$/i, "") || "decrypted-file";

            downloadFile(data, originalName);
            showStatus(
                `Decrypted and downloaded as ${originalName}. Your original file is back.`,
                "success"
            );
        } catch (error) {
            showStatus(error.message, "error");
        } finally {
            setBusy(false);
        }
    }

    /**
     * Optional action: upload an .sfs file that is already selected (for
     * example one downloaded earlier or copied from another device).
     */
    async function handleUploadSelected() {
        if (busy) return;

        if (!file) {
            showStatus("Please select an encrypted .sfs file to upload.", "error");
            return;
        }

        if (!file.name.toLowerCase().endsWith(".sfs")) {
            showStatus(
                "Only encrypted .sfs files can be uploaded. Use \"Encrypt & upload\" for a normal file.",
                "error"
            );
            return;
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            showStatus(
                `This file is too large. Maximum upload size is ${MAX_FILE_SIZE_MB} MB.`,
                "error"
            );
            return;
        }

        setBusy(true);
        showStatus("Uploading encrypted file...", "info");

        try {
            const looksEncrypted = await hasSfsHeader(file);
            if (!looksEncrypted) {
                throw new Error(
                    "This file does not look like a valid encrypted .sfs file."
                );
            }

            const result = await uploadEncryptedFile(file);
            showStatus(
                `Upload complete. Stored as ${result.fileId} - it now appears in "My Stored Files".`,
                "success"
            );

            await refreshStoredFiles();
        } catch (error) {
            showStatus(`Upload failed: ${error.message}`, "error");
        } finally {
            setBusy(false);
        }
    }

    // Downloads one stored encrypted file and selects it, so it can be
    // decrypted straight away without picking it again.
    async function handleDownloadStoredFile(storedFile) {
        setDownloadingId(storedFile.fileId);

        try {
            const encryptedBlob = await downloadStoredFile(storedFile.fileId);

            downloadFile(encryptedBlob, storedFile.fileId);

            setFile(
                new File([encryptedBlob], storedFile.fileId, {
                    type: "application/octet-stream"
                })
            );

            showStatus(
                `Downloaded ${storedFile.fileId} and selected it. Enter its password, then click "Decrypt & download".`,
                "success"
            );
        } catch (error) {
            showStatus(`Download failed: ${error.message}`, "error");
        } finally {
            setDownloadingId("");
        }
    }

    // Deletes one stored encrypted file. Deleting is permanent, so it asks
    // for confirmation first.
    async function handleDeleteStoredFile(storedFile) {
        const confirmed = window.confirm(
            `Delete ${storedFile.fileId}?\n\nThe encrypted file will be removed from the server permanently. This cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        setDeletingId(storedFile.fileId);

        try {
            await deleteStoredFile(storedFile.fileId);

            // If the deleted file is the one selected for decryption, clear it
            // so the form does not keep pointing at a file that is gone.
            if (file && file.name === storedFile.fileId) {
                setFile(null);
            }

            showStatus(`Deleted ${storedFile.fileId} from the server.`, "success");

            await refreshStoredFiles();
        } catch (error) {
            showStatus(`Delete failed: ${error.message}`, "error");
        } finally {
            setDeletingId("");
        }
    }

    return (
        <main className="app">
            <header className="hero">
                <div className="hero-text">
                    <span className="badge">
                        <Icon name="shield" size={14} />
                        Client-side encryption
                    </span>

                    <h1>Secure File Storage</h1>
                    <p className="hero-sub">
                        Encrypt any file in your browser with AES-256-GCM and store
                        only the encrypted <code>.sfs</code> copy. Decrypt it later
                        with your password. The server never sees your file or your
                        password.
                    </p>
                </div>

                <div className="hero-side">
                    <ThemeToggle />

                    <ul className="hero-facts">
                        <li>
                            <Icon name="lock" size={15} />
                            AES-256-GCM
                        </li>
                        <li>
                            <Icon name="key" size={15} />
                            PBKDF2 &middot; 310,000
                        </li>
                        <li>
                            <Icon name="cloud" size={15} />
                            {MAX_FILE_SIZE_MB} MB limit
                        </li>
                    </ul>
                </div>
            </header>

            <div className="layout">
                <div className="column">
                    <FileSelector
                        file={file}
                        onFileChange={handleFileChange}
                        onClear={handleClearFile}
                        disabled={busy}
                    />

                    <PasswordInput
                        password={password}
                        onPasswordChange={setPassword}
                        disabled={busy}
                    />

                    <FileActions
                        onEncryptUpload={handleEncryptAndUpload}
                        onEncryptDownload={handleEncryptAndDownload}
                        onDecrypt={handleDecrypt}
                        onUploadSelected={handleUploadSelected}
                        busy={busy}
                        statusMessage={statusMessage}
                        statusType={statusType}
                    />
                </div>

                <StoredFiles
                    files={storedFiles}
                    loading={listLoading}
                    error={listError}
                    downloadingId={downloadingId}
                    deletingId={deletingId}
                    onRefresh={refreshStoredFiles}
                    onDownload={handleDownloadStoredFile}
                    onDelete={handleDeleteStoredFile}
                />
            </div>

            <footer className="app-footer">
                <p>
                    <strong>Good to know:</strong> there are no accounts or access
                    control yet, so anyone who can reach this server can list,
                    download and delete the encrypted files. The password is never
                    sent to the server, and a forgotten password cannot be recovered.
                </p>
            </footer>
        </main>
    );
}

export default App;
