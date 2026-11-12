import { useEffect, useState } from "react";

import Icon from "./Icon";

// Remembered in localStorage so the choice survives a reload.
const STORAGE_KEY = "sfs-theme";

function prefersDark() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readSavedTheme() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "dark" || saved === "light") {
            return saved;
        }
    } catch {
        // localStorage can throw when the browser blocks storage; the
        // system preference below is a fine fallback.
    }

    return prefersDark() ? "dark" : "light";
}

/**
 * Light / dark switch.
 *
 * The theme is applied by setting data-theme="dark" on <html>; all colours in
 * App.css are variables, so the whole page changes at once. index.html applies
 * the saved theme before the page paints, so there is no white flash.
 */
function ThemeToggle() {
    const [theme, setTheme] = useState(readSavedTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;

        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // Not being able to remember the choice is not worth an error.
        }
    }, [theme]);

    const isDark = theme === "dark";

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
            <Icon name={isDark ? "sun" : "moon"} size={16} />
            <span>{isDark ? "Light" : "Dark"}</span>
        </button>
    );
}

export default ThemeToggle;
