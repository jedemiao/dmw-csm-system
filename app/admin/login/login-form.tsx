"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Eye, EyeSlash, LockKey, User } from "@phosphor-icons/react";
import { login, type LoginState } from "@/lib/auth/actions";

const INITIAL_STATE: LoginState = { error: null };

type LoginFormProps = {
  // Username kept from the last "Keep me signed in" sign-in on this device.
  rememberedUsername?: string;
};

export function LoginForm({ rememberedUsername }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="form-shell login-card">
      <div className="login-card__badge">
        <Image src="/images/dmw_logo.png" alt="" width={60} height={60} quality={100} />
      </div>

      <h1>Admin sign in</h1>
      <p className="login-card__subtitle">Restricted to authorized DMW CSM staff.</p>

      {state.error && (
        <div className="alert alert-error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          <p className="alert-summary">{state.error}</p>
        </div>
      )}

      <div className="login-card__fields">
        <div className="field">
          <label htmlFor="username">Username</label>
          <div className="input-icon">
            <User size={18} aria-hidden="true" />
            <input
              type="text"
              id="username"
              name="username"
              autoComplete="username"
              defaultValue={rememberedUsername}
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="input-icon">
            <LockKey size={18} aria-hidden="true" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              autoComplete="current-password"
              required
              className="has-toggle"
            />
            <button
              type="button"
              className="input-icon__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <label className="login-card__remember" htmlFor="remember">
          <input type="checkbox" id="remember" name="remember" defaultChecked={Boolean(rememberedUsername)} />
          <span>Keep me signed in</span>
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>
  );
}
