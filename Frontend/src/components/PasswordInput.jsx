import { useState } from "react";

import Icon from "./Icon";

/**
 * Password field. The password stays in React state and is used only by the
 * encryption/decryption functions in the browser - it is never sent anywhere.
 */
function PasswordInput({ password, onPasswordChange, disabled }) {
    const [visible, setVisible] = useState(false);

    return (
        <section className="panel">
            <div className="panel-heading">
                <span className="step-badge">2</span>
                <div className="panel-heading-text">
                    <h2>Enter your password</h2>
                    <p className="hint">
                        The password is used to build the AES-256 key in this
                        browser. It is never sent to the server.
                    </p>
                </div>
            </div>

            <label className="field">
                <span className="field-label">Password</span>

                <span className="input-wrap">
                    <Icon name="key" size={17} className="input-icon" />

                    <input
                        className="password-input"
                        type={visible ? "text" : "password"}
                        placeholder="At least 8 characters"
                        autoComplete="off"
                        value={password}
                        onChange={(event) => onPasswordChange(event.target.value)}
                        disabled={disabled}
                        aria-label="Password"
                    />

                    <button
                        type="button"
                        className="input-suffix"
                        onClick={() => setVisible((current) => !current)}
                        disabled={disabled}
                        aria-label={visible ? "Hide password" : "Show password"}
                        title={visible ? "Hide password" : "Show password"}
                    >
                        <Icon name={visible ? "eyeOff" : "eye"} size={17} />
                    </button>
                </span>

                <span className="field-note">
                    Use at least 8 characters when encrypting. The same password is
                    needed to decrypt, and it cannot be recovered if you forget it.
                </span>
            </label>
        </section>
    );
}

export default PasswordInput;
