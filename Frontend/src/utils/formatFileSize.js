/**
 * Format a byte count as "512 B", "12.4 KB", "20.0 MB" ...
 */
export function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) {
        return "unknown size";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const units = ["KB", "MB", "GB"];
    let size = bytes / 1024;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
}
