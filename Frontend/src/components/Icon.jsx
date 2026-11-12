/**
 * Very small inline SVG icon set.
 *
 * Everything is drawn with paths, so there is no icon library and no extra
 * dependency. Icons use `currentColor`, which means they take the text colour
 * of whatever button or card they are placed in.
 */

const icons = {
    shield: <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z" />,
    lock: (
        <>
            <rect x="4.5" y="10" width="15" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
    ),
    key: (
        <>
            <circle cx="8" cy="15" r="4" />
            <path d="M10.8 12.2L20 3" />
            <path d="M16.5 6.5L19 9" />
            <path d="M14 9l2.5 2.5" />
        </>
    ),
    file: (
        <>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
        </>
    ),
    doc: (
        <>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 13h6" />
            <path d="M9 17h4" />
        </>
    ),
    sheet: (
        <>
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M4 10h16" />
            <path d="M4 15h16" />
            <path d="M10 4v16" />
        </>
    ),
    text: (
        <>
            <path d="M7 4h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            <path d="M9 9h6" />
            <path d="M9 13h6" />
            <path d="M9 17h4" />
        </>
    ),
    image: (
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="M21 16l-4.5-4.5L7 21" />
        </>
    ),
    audio: (
        <>
            <path d="M9 18V6l10-2v12" />
            <circle cx="6.5" cy="18" r="2.5" />
            <circle cx="16.5" cy="16" r="2.5" />
        </>
    ),
    video: (
        <>
            <rect x="3" y="5" width="13" height="14" rx="2" />
            <path d="M16 10l5-3v10l-5-3z" />
        </>
    ),
    archive: (
        <>
            <rect x="3" y="4" width="18" height="5" rx="1.5" />
            <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
            <path d="M10 13h4" />
        </>
    ),
    cloud: <path d="M7 18a4 4 0 0 1 .6-8A5.5 5.5 0 0 1 18 11.4 3.5 3.5 0 0 1 17.5 18z" />,
    upload: (
        <>
            <path d="M12 16V4" />
            <path d="M7 9l5-5 5 5" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </>
    ),
    download: (
        <>
            <path d="M12 4v12" />
            <path d="M7 11l5 5 5-5" />
            <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
        </>
    ),
    refresh: (
        <>
            <path d="M20 11a8 8 0 1 0-2.3 5.7" />
            <path d="M20 5v6h-6" />
        </>
    ),
    check: <path d="M20 6L9 17l-5-5" />,
    alert: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
        </>
    ),
    info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 8h.01" />
        </>
    ),
    eye: (
        <>
            <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
            <circle cx="12" cy="12" r="2.5" />
        </>
    ),
    eyeOff: (
        <>
            <path d="M4 4l16 16" />
            <path d="M9.9 5.3A10.6 10.6 0 0 1 12 5c6.4 0 10 6 10 6a17 17 0 0 1-2.4 3" />
            <path d="M6.3 7.6A17 17 0 0 0 2 11s3.6 6 10 6a10.9 10.9 0 0 0 4-.7" />
        </>
    ),
    folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    trash: (
        <>
            <path d="M4 7h16" />
            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
        </>
    ),
    sun: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.9 4.9l1.4 1.4" />
            <path d="M17.7 17.7l1.4 1.4" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M4.9 19.1l1.4-1.4" />
            <path d="M17.7 6.3l1.4-1.4" />
        </>
    ),
    moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
    x: (
        <>
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
        </>
    )
};

function Icon({ name, size = 18, className = "" }) {
    return (
        <svg
            className={className ? `icon ${className}` : "icon"}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {icons[name] || icons.file}
        </svg>
    );
}

export default Icon;
