import Icon from "./Icon";

const STATUS_ICONS = {
    success: "check",
    error: "alert",
    info: "info"
};

/**
 * The main actions plus the status message.
 *
 * "Encrypt & upload" is the primary action: it encrypts the selected file in
 * the browser and sends the resulting .sfs file to the server in one step, so
 * there is no need to select the encrypted file again.
 *
 * The two smaller buttons are optional paths for the same encrypted bytes:
 * save them to disk instead, or upload a .sfs file that is already selected.
 */
function FileActions({
    onEncryptUpload,
    onEncryptDownload,
    onDecrypt,
    onUploadSelected,
    busy,
    statusMessage,
    statusType
}) {
    return (
        <section className="panel">
            <div className="panel-heading">
                <span className="step-badge">3</span>
                <div className="panel-heading-text">
                    <h2>Encrypt &amp; upload, or decrypt</h2>
                    <p className="hint">
                        <strong>Encrypt &amp; upload</strong> does everything in one
                        step: the file is encrypted here in the browser, then only
                        the encrypted <code>.sfs</code> bytes are sent to the server.
                    </p>
                </div>
            </div>

            <div className="actions">
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onEncryptUpload}
                    disabled={busy}
                >
                    <Icon name="upload" size={17} />
                    Encrypt &amp; upload
                </button>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onDecrypt}
                    disabled={busy}
                >
                    <Icon name="key" size={17} />
                    Decrypt &amp; download
                </button>
            </div>

            <div className="actions actions-secondary">
                <button
                    type="button"
                    className="btn btn-outline btn-small"
                    onClick={onEncryptDownload}
                    disabled={busy}
                >
                    <Icon name="download" size={15} />
                    Encrypt &amp; download only
                </button>

                <button
                    type="button"
                    className="btn btn-outline btn-small"
                    onClick={onUploadSelected}
                    disabled={busy}
                >
                    <Icon name="cloud" size={15} />
                    Upload selected .sfs
                </button>
            </div>

            <p className="hint hint-small">
                Optional: save the encrypted file instead of uploading it, or upload
                an <code>.sfs</code> file you already have.
            </p>

            {busy && (
                <p className="status status-info" role="status" aria-live="polite">
                    <span className="spinner" aria-hidden="true" />
                    <span>{statusMessage || "Working, please wait..."}</span>
                </p>
            )}

            {!busy && statusMessage && (
                <p
                    className={`status status-${statusType}`}
                    role={statusType === "error" ? "alert" : "status"}
                    aria-live="polite"
                >
                    <Icon
                        name={STATUS_ICONS[statusType] || "info"}
                        size={17}
                        className="status-icon"
                    />
                    <span>{statusMessage}</span>
                </p>
            )}
        </section>
    );
}

export default FileActions;
