
import { useState } from "react";
import { encryptFile, decryptFile } from "./utils/fileEncryption";

function App() {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    function downloadFile(data, fileName) {
        const blob = new Blob([data]);
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function handleEncryption() {
        if (!file || !password) {
            setStatus("Please select a file and enter a password.");
            return;
        }

        try {
            setLoading(true);
            setStatus("Encrypting file...");

            const encryptedData = await encryptFile(file, password);

            downloadFile(encryptedData, file.name + ".sfs");

            setStatus("File encrypted successfully!");
        } catch (error) {
            setStatus("Encryption failed: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDecryption() {
        if (!file || !password) {
            setStatus("Please select a file and enter a password.");
            return;
        }

        try {
            setLoading(true);
            setStatus("Decrypting file...");

            const decryptedData = await decryptFile(file, password);

            const originalName = file.name.endsWith(".sfs")
                ? file.name.slice(0, -4)
                : "decrypted-file";

            downloadFile(decryptedData, originalName);

            setStatus("File decrypted successfully!");
        } catch (error) {
            setStatus("Decryption failed. Check your password or file.");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload() {
        if (!file) {
            setStatus("Please select an encrypted .sfs file.");
            return;
        }

        if (!file.name.toLowerCase().endsWith(".sfs")) {
            setStatus("Please select an encrypted .sfs file.");
            return;
        }

        try {
            setLoading(true);
            setStatus("Uploading encrypted file...");

            const formData = new FormData();
            formData.append("encryptedFile", file);

            const response = await fetch(
                "http://localhost:3000/api/files/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Upload failed.");
            }

            setStatus(
                `Upload successful! File ID: ${result.fileId}`
            );
        } catch (error) {
            setStatus("Upload failed: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            maxWidth: "600px",
            margin: "60px auto",
            padding: "30px",
            fontFamily: "Arial"
        }}>
            <h1>Secure File Storage</h1>

            <p>
                Encrypt your files before storing them securely.
            </p>

            <hr />

            <h3>Select File</h3>

            <input
                type="file"
                onChange={(e) => {
                    setFile(e.target.files[0]);
                    setStatus("");
                }}
            />

            {file && (
                <p>Selected: {file.name}</p>
            )}

            <h3>Enter Password</h3>

            <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                    width: "100%",
                    padding: "10px",
                    boxSizing: "border-box"
                }}
            />

            <br /><br />

            <button onClick={handleEncryption} disabled={loading}>
                Encrypt File
            </button>

            {" "}

            <button onClick={handleDecryption} disabled={loading}>
                Decrypt File
            </button>

            {" "}

            <button onClick={handleUpload} disabled={loading}>
                Upload Encrypted File
            </button>

            <p>{status}</p>
        </div>
    );
}

export default App;
