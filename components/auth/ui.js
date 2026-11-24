"use client";

// Building blocks for the sign-in screens, from the Figma Make app's auth styles
// (.auth-field, .auth-primary, .glass-surface, ...): light text and glass panels
// over the app's green canvas.

import { useId, useState } from "react";

export const glass =
  "border border-[rgba(246,248,237,0.38)] bg-[linear-gradient(145deg,rgba(246,248,237,0.16),rgba(246,248,237,0.08))] shadow-[inset_0_1px_0_rgba(246,248,237,0.28),0_18px_45px_rgba(0,31,62,0.2)] backdrop-blur-[22px]";

const PLUM = "#1d4990";

/** The SixthSense mark (same paths as the Make app's SixthSenseLogo), drawn white. */
export function Logo({ className = "" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 174.13 179.37" className={`block shrink-0 fill-paper drop-shadow-[0_8px_12px_rgba(0,31,62,0.16)] ${className}`}>
      <path d="M129.9,97.03c-33.68-9.27-57.83-28.21-53.96-42.28,3.88-14.08,34.32-17.97,68-8.7.1.03.2.06.3.08,9.63,2.67,16.93-8.77,10.26-16.22C138.09,11.55,114.24,0,87.67,0,45.04,0,9.37,29.74.25,69.6c-1.27,5.55,2.47,11.05,8.1,11.97,4.97.81,10.11,1.93,15.32,3.37,33.68,9.27,57.83,28.21,53.96,42.28-2.77,10.06-19.11,14.91-40.5,13.48-9.7-.65-14.59,11.39-7.15,17.65,15.59,13.12,35.72,21.02,57.69,21.02,40.75,0,75.12-27.18,86.04-64.39,1.9-6.47-2.88-12.89-9.62-12.92-10.23-.05-22-1.67-34.19-5.03Z" />
      <path d="M139.12,89.82c-5.8-15.65-15.15-15.44-27.09-10.68-.95.38-1.49-1.24-.63-1.8,10.01-6.56,14.46-15.28,12.59-26.45-.17-1.01,1.3-1.69,1.74-.77,5.28,10.9,14.67,13.55,27.69,9.69.96-.28,1.42,1.24.6,1.8-10.52,7.04-15.56,15.95-13.18,27.4.21,1.02-1.37,1.8-1.73.82Z" />
    </svg>
  );
}

/** Logo + wordmark above the recovery card (.auth-brand). */
export function AuthBrand() {
  return (
    <div className="mb-6 flex items-center justify-center gap-[18px]" aria-label="Sixth Sense">
      <Logo className="h-[60px] w-[58px] sm:h-[clamp(70px,8.3vw,100px)] sm:w-[clamp(68px,8vw,96px)]" />
      <p className="text-[31px] font-bold whitespace-nowrap text-paper">SixthSense</p>
    </div>
  );
}

/**
 * Text input (.auth-field). `floating` gives the smaller label used on Create Account,
 * set just above the field; otherwise the larger label of the login form.
 */
export function AuthField({ label, name, type = "text", required, floating, error, helper, defaultValue, autoComplete, minLength, maxLength, placeholder, trailing, inputType }) {
  const id = useId();
  return (
    <div className={`group grid min-w-0 content-start ${floating ? "gap-1.5" : "gap-2.5"}`}>
      <label
        htmlFor={id}
        className={`${floating ? "px-3 text-[13px] leading-[1.3]" : "px-[3px] text-sm leading-[1.3]"} tracking-[0.15px] transition-colors ${error ? "" : "text-paper group-focus-within:text-sense-lime"}`}
        style={error ? { color: PLUM } : undefined}
      >
        {label}
        {required && floating ? " *" : ""}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={inputType ?? type}
          required={required}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={error || undefined}
          className={`h-[52px] w-full rounded-[24px] border bg-[rgba(246,248,237,0.14)] px-[18px] py-3.5 text-[13px] text-paper shadow-[inset_0_2px_5px_rgba(0,31,62,0.26),0_1px_0_rgba(246,248,237,0.22)] outline-none backdrop-blur-[14px] transition placeholder:text-[rgba(246,248,237,0.65)] focus:border-2 focus:border-sense-lime focus:px-[17px] focus:py-[13px] focus:shadow-[0_0_0_4px_rgba(221,254,86,0.13)] ${trailing ? "pr-12" : ""} ${error ? "border-[#1d4990]" : "border-[rgba(246,248,237,0.24)]"}`}
        />
        {trailing}
      </div>
      {helper && (
        <small className="block min-h-[17px] px-1 pt-[3px] text-xs leading-[1.66] tracking-[0.4px]" style={{ color: error ? PLUM : "rgba(246,248,237,0.75)" }}>
          {helper}
        </small>
      )}
    </div>
  );
}

/** Password input with the Make app's eye icon, which shows or hides the text. */
export function PasswordField(props) {
  const [shown, setShown] = useState(false);
  return (
    <AuthField
      {...props}
      type="password"
      inputType={shown ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className={`absolute top-1/2 right-2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full transition hover:bg-paper/10 ${shown ? "opacity-100" : "opacity-80"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/auth/eye.svg" alt="" width={22} height={15} className="brightness-0 invert" />
        </button>
      }
    />
  );
}

/** "Remember Me" checkbox with the Make app's checkbox icons. */
export function AuthCheck({ name, label, defaultChecked = false }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="relative flex w-max cursor-pointer items-center gap-0.5 text-base leading-normal text-paper">
      <input
        type="checkbox"
        name={name}
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        className="peer absolute size-px overflow-hidden opacity-0"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={on ? "/auth/checkbox-checked.svg" : "/auth/checkbox.svg"}
        alt=""
        width={24}
        height={24}
        className="box-content size-6 rounded-md p-[9px] brightness-0 invert peer-focus-visible:outline-2 peer-focus-visible:outline-sense-lime"
      />
      <span>{label}</span>
    </label>
  );
}

const buttonBase =
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-[24px] px-[22px] py-2 text-[15px] leading-[26px] tracking-[0.46px] uppercase transition disabled:cursor-default disabled:opacity-70";

/** Filled button (.auth-primary). */
export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`${buttonBase} bg-[#eaffab] font-bold text-[#1d4990] shadow-[0_8px_0_rgba(0,31,62,0.18)] hover:bg-sense-blue hover:text-paper ${className}`}
    >
      {children}
    </button>
  );
}

/** Outlined button (.auth-secondary). Pass href to render a link. */
export function SecondaryButton({ children, className = "", href, ...props }) {
  const cls = `${buttonBase} border border-[rgba(246,248,237,0.72)] bg-[rgba(246,248,237,0.08)] font-medium text-paper hover:bg-[rgba(246,248,237,0.16)] ${className}`;
  return href ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <button type="button" {...props} className={cls}>
      {children}
    </button>
  );
}

/** Underlined text link under the login form (.auth-link). */
export function AuthLink({ href, children, accent }) {
  return (
    <a
      href={href}
      className="w-max max-w-full text-[13px] leading-[1.66] tracking-[0.02em] underline"
      style={{ color: accent ? PLUM : "var(--color-paper)" }}
    >
      {children}
    </a>
  );
}

/** Error / confirmation line under a form. */
export function FormMessage({ error, children }) {
  if (!children) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-[18px] px-4 py-2.5 text-xs leading-normal font-semibold ${error ? "bg-[#ff7f7f]/90 text-sense-navy" : "bg-sense-lime/90 text-sense-navy"}`}
    >
      {children}
    </p>
  );
}

/** Small coloured label above a heading (.eyebrow). */
export function Eyebrow({ children }) {
  return <p className="mb-[5px] text-[11px] font-bold tracking-[0.11em] text-[#ff7f7f] uppercase">{children}</p>;
}
