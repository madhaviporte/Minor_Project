import { formatFileSize } from "../utils/formatFileSize";
import Icon from "./Icon";

function formatUploadDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "unknown date" : date.toLocaleString();
}

/**
 * "My Stored Files": the encrypted files the server currently holds.
 *
 * These are the encrypted bytes exactly as uploaded. The list shows the stored
 * encrypted file name (a random ID), not the original name - the original name
 * lives inside the encrypted header, where the server cannot use it.
 */
function StoredFiles({
    files,
    loading,
    error,
    downloadingId,
    deletingId,
    onRefresh,
    onDownload,
    onDelete
}) {
    // One operation at a time keeps the list predictable.
    const rowBusy = Boolean(downloadingId) || Boolean(deletingId);

    return (
        <section className="panel">
            <div className="panel-heading">
                <span className="step-badge">
                    <Icon name="folder" size={15} />
                </span>
                <div className="panel-heading-text">
                    <h2>My Stored Files</h2>
                    <p className="hint">
                        Encrypted files on the server. Download one to decrypt it, or
                        delete it when you no longer need it.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-small btn-outline"
                    onClick={onRefresh}
                    disabled={loading}
                >
                    <Icon name="refresh" size={15} />
                    {loading ? "Loading" : "Refresh"}
                </button>
            </div>

            {error && (
                <p className="status status-error" role="alert">
                    <Icon name="alert" size={17} className="status-icon" />
                    <span>{error}</span>
                </p>
            )}

            {!error && loading && files.length === 0 && (
                <p className="muted-note">Loading stored files...</p>
            )}

            {!error && !loading && files.length === 0 && (
                <div className="empty-state">
                    <Icon name="folder" size={26} />
                    <p>No encrypted files stored yet.</p>
                    <span>
                        Select a file, enter a password and click &ldquo;Encrypt &amp;
                        upload&rdquo;.
                    </span>
                </div>
            )}

            {files.length > 0 && (
                <>
                    <p className="list-count">
                        {files.length} encrypted file{files.length === 1 ? "" : "s"}{" "}
                        stored
                    </p>

                    <ul className="file-list">
                        {files.map((storedFile) => (
                            <li key={storedFile.fileId} className="file-item">
                                <span className="file-item-icon">
                                    <Icon name="lock" size={15} />
                                </span>

                                <div className="file-info">
                                    <span
                                        className="file-name"
                                        title={storedFile.fileId}
                                    >
                                        {storedFile.fileId}
                                    </span>
                                    <span className="file-meta">
                                        {formatFileSize(storedFile.size)}
                                    </span>
                                    <span className="file-meta">
                                        {formatUploadDate(storedFile.uploadedAt)}
                                    </span>
                                </div>

                                <div className="file-item-actions">
                                    <button
                                        type="button"
                                        className="btn btn-small btn-secondary"
                                        onClick={() => onDownload(storedFile)}
                                        disabled={rowBusy || loading}
                                        aria-label={`Download and decrypt ${storedFile.fileId}`}
                                        title="Download this encrypted file, then decrypt it here"
                                    >
                                        <Icon name="download" size={15} />
                                        {downloadingId === storedFile.fileId
                                            ? "Downloading"
                                            : "Download"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-small btn-danger"
                                        onClick={() => onDelete(storedFile)}
                                        disabled={rowBusy || loading}
                                        aria-label={`Delete ${storedFile.fileId}`}
                                        title="Delete this encrypted file from the server"
                                    >
                                        <Icon name="trash" size={15} />
                                        {deletingId === storedFile.fileId
                                            ? "Deleting"
                                            : "Delete"}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}

export default StoredFiles;
