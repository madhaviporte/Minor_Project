import { formatFileSize } from "../utils/formatFileSize";
import { describeFileType } from "../utils/fileType";
import Icon from "./Icon";

/**
 * File input used for encrypting a normal file and for selecting an
 * encrypted .sfs file to decrypt or upload.
 *
 * There is deliberately no `accept` attribute here: it would filter the
 * picker down to a list of extensions (older versions of this project even
 * limited it to .txt). Without it, every file type can be chosen - PDF, Word,
 * Excel, images, audio, video, text and anything else - and the backend still
 * only ever accepts encrypted .sfs files.
 */
function FileSelector({ file, onFileChange, onClear, disabled }) {
    const fileType = file ? describeFileType(file) : null;

    function handleChange(event) {
        const selectedFile = event.target.files[0] || null;

        // Clear the native input so picking the same file twice in a row still
        // fires onChange. The selected file itself is kept in React state.
        event.target.value = "";

        onFileChange(selectedFile);
    }

    return (
        <section className="panel">
            <div className="panel-heading">
                <span className="step-badge">1</span>
                <div className="panel-heading-text">
                    <h2>Select a file</h2>
                    <p className="hint">
                        Any file type can be encrypted. After encryption you get a
                        new <code>.sfs</code> file - that is the one you upload or
                        decrypt.
                    </p>
                </div>
            </div>

            <label className="dropzone">
                <span className="dropzone-icon">
                    <Icon name="upload" size={22} />
                </span>
                <span className="dropzone-title">Choose a file from your computer</span>
                <span className="dropzone-sub">
                    PDF, DOCX, XLSX, JPG, PNG, GIF, WEBP, MP3, WAV, MP4, MOV, TXT,
                    CSV and more
                </span>

                <input
                    className="file-input"
                    type="file"
                    onChange={handleChange}
                    disabled={disabled}
                    aria-label="Select a file to encrypt, or an encrypted .sfs file"
                />

                <span className="dropzone-note">Maximum file size: 20 MB</span>
            </label>

            {file && (
                <div className="selected-file">
                    <span className="selected-file-icon">
                        <Icon name={fileType.icon} size={19} />
                    </span>

                    <div className="selected-file-text">
                        <span className="selected-file-name" title={file.name}>
                            {file.name}
                        </span>
                        <span className="selected-file-meta">
                            {fileType.label} &middot; {formatFileSize(file.size)}
                        </span>
                    </div>

                    {onClear && (
                        <button
                            type="button"
                            className="icon-button"
                            onClick={onClear}
                            disabled={disabled}
                            aria-label="Remove the selected file"
                            title="Remove the selected file"
                        >
                            <Icon name="x" size={16} />
                        </button>
                    )}
                </div>
            )}

            {!file && (
                <p className="hint hint-spaced">
                    Already have an encrypted file? Select the <code>.sfs</code> file
                    (or download one from the list) to decrypt it.
                </p>
            )}
        </section>
    );
}

export default FileSelector;
