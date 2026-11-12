/**
 * Save bytes to the user's computer with the given file name.
 * `data` can be an ArrayBuffer or a Uint8Array.
 */
export function downloadFile(data, fileName) {
    // Never let a stored file name contain path separators or invalid characters.
    const safeName = String(fileName || "download").replace(/[\\/:*?"<>|]/g, "_");

    const blob = new Blob([data], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = safeName;

    // The link has to be in the document for some browsers (e.g. Firefox).
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
