/**
 * Human-readable file type names, used only for display in the UI.
 *
 * This list never restricts which files can be selected - it just gives the
 * selected file a friendly label and an icon. Any unknown extension is shown
 * as "<EXT> file", so unusual or "other" file types work exactly the same.
 */

const FILE_TYPES = {
    pdf: { label: "PDF document", icon: "doc" },

    doc: { label: "Word document", icon: "doc" },
    docx: { label: "Word document", icon: "doc" },
    odt: { label: "Word document", icon: "doc" },
    rtf: { label: "Rich text document", icon: "doc" },
    ppt: { label: "Presentation", icon: "doc" },
    pptx: { label: "Presentation", icon: "doc" },

    xls: { label: "Excel spreadsheet", icon: "sheet" },
    xlsx: { label: "Excel spreadsheet", icon: "sheet" },
    ods: { label: "Spreadsheet", icon: "sheet" },
    csv: { label: "CSV file", icon: "sheet" },

    jpg: { label: "JPEG image", icon: "image" },
    jpeg: { label: "JPEG image", icon: "image" },
    png: { label: "PNG image", icon: "image" },
    gif: { label: "GIF image", icon: "image" },
    webp: { label: "WebP image", icon: "image" },
    bmp: { label: "Bitmap image", icon: "image" },
    svg: { label: "SVG image", icon: "image" },

    mp3: { label: "MP3 audio", icon: "audio" },
    wav: { label: "WAV audio", icon: "audio" },
    m4a: { label: "Audio file", icon: "audio" },
    ogg: { label: "Audio file", icon: "audio" },

    mp4: { label: "MP4 video", icon: "video" },
    mov: { label: "QuickTime video", icon: "video" },
    webm: { label: "WebM video", icon: "video" },
    avi: { label: "AVI video", icon: "video" },
    mkv: { label: "Video file", icon: "video" },

    txt: { label: "Text file", icon: "text" },
    md: { label: "Markdown file", icon: "text" },
    log: { label: "Log file", icon: "text" },

    zip: { label: "ZIP archive", icon: "archive" },
    rar: { label: "RAR archive", icon: "archive" },
    "7z": { label: "7-Zip archive", icon: "archive" },
    tar: { label: "TAR archive", icon: "archive" },
    gz: { label: "Gzip archive", icon: "archive" },

    // Our own encrypted files.
    sfs: { label: "Encrypted .sfs file", icon: "lock" }
};

/**
 * "report.final.PDF" -> "pdf"
 */
export function getFileExtension(fileName) {
    const name = String(fileName || "");
    const lastDot = name.lastIndexOf(".");

    if (lastDot <= 0 || lastDot === name.length - 1) {
        return "";
    }

    return name.slice(lastDot + 1).toLowerCase();
}

/**
 * Describe a File so the UI can show something better than "unknown".
 * Always returns { label, icon, extension }.
 */
export function describeFileType(file) {
    const extension = getFileExtension(file && file.name);
    const known = FILE_TYPES[extension];

    if (known) {
        return { label: known.label, icon: known.icon, extension };
    }

    return {
        label: extension ? `${extension.toUpperCase()} file` : "File",
        icon: "file",
        extension
    };
}
