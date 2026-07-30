"use client";

import { useState } from "react";
import { Eye, EyeSlash, LockKey } from "@phosphor-icons/react";

export function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  help,
  error,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  help?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-icon">
        <LockKey size={18} aria-hidden="true" />
        <input
          type={visible ? "text" : "password"}
          id={id}
          name={name}
          autoComplete={autoComplete}
          required
          className="has-toggle"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        />
        <button
          type="button"
          className="input-icon__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <span className="field-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
      {help && (
        <p className="field-help" id={`${id}-help`}>
          {help}
        </p>
      )}
    </div>
  );
}
