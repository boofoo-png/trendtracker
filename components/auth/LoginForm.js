"use client";

// Login screen from the Figma Make app (LoginPage): brand lockup and tagline on the
// left, a glass "Let's start" form on the right. The Make app's demo mode (leave
// both fields blank) is left out on purpose: it would create a throwaway account.

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { AuthCheck, AuthField, AuthLink, FormMessage, Logo, PasswordField, PrimaryButton, glass } from "./ui";
import { initials } from "@/lib/settings";
import { listSavedAccounts, switchToAccount } from "@/lib/savedAccounts";

/** Accounts already signed in on this browser: one tap to go back to them. */
function SavedAccounts({ backId }) {
  const [accounts, setAccounts] = useState([]);
  const [busy, setBusy] = useState(null);
  useEffect(() => {
    // localStorage is only readable after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccounts(listSavedAccounts());
  }, []);
  if (!accounts.length) return null;

  const go = (id) => {
    setBusy(id);
    switchToAccount(id);
  };
  const back = accounts.find((a) => a.userId === backId);

  return (
    <div className="grid gap-2">
      {back && (
        <button
          type="button"
          onClick={() => go(back.userId)}
          disabled={busy !== null}
          className="w-max cursor-pointer text-[13px] font-semibold text-paper underline disabled:opacity-60"
        >
          ← Cancel, back to {back.company || back.name || back.email}
        </button>
      )}
      {accounts.some((a) => a !== back) && (
        <p className="text-[13px] tracking-[0.02em] text-paper/80">{back ? "Or continue as" : "Continue as"}</p>
      )}
      <ul className="grid gap-1.5">
        {accounts.filter((a) => a !== back).map((a) => (
          <li key={a.userId}>
            <button
              type="button"
              onClick={() => go(a.userId)}
              disabled={busy !== null}
              className="flex w-full cursor-pointer items-center gap-3 rounded-[18px] border border-paper/30 bg-paper/10 px-3 py-2 text-left text-paper transition hover:bg-paper/20 disabled:opacity-60"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-paper text-xs font-bold text-sense-blue">
                {initials(a.company || a.name || a.email)}
              </span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-xs font-semibold">{a.company || a.name || a.email}</span>
                <span className="truncate text-xs text-paper/75">{a.email}</span>
              </span>
              {busy === a.userId && <span className="text-xs">Switching…</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState(signIn, null);
  const error = state?.error ?? params.get("error");
  const adding = params.get("add") === "1";

  return (
    <div className="grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)] items-center gap-7 min-[901px]:grid-cols-[minmax(320px,0.95fr)_minmax(420px,1.05fr)] min-[901px]:gap-[clamp(40px,8vw,110px)]">
      <section className="flex flex-col justify-between gap-[50px] py-[25px] min-[901px]:min-h-[500px] min-[901px]:gap-0">
        <div className="flex items-center gap-3.5 min-[621px]:gap-[22px]">
          <Logo className="h-[60px] w-[58px] min-[621px]:h-[clamp(70px,8.3vw,100px)] min-[621px]:w-[clamp(68px,8vw,96px)]" />
          <div className="grid gap-1.5 text-paper">
            <p className="text-[15px] tracking-[0.05em] uppercase min-[621px]:text-[clamp(17px,2.2vw,26px)]">Welcome to</p>
            <strong className="text-[21px] font-normal min-[621px]:text-[clamp(22px,2.7vw,32px)]">SixthSense</strong>
          </div>
        </div>
        <p className="hidden text-[clamp(20px,2.4vw,28px)] leading-[1.35] font-bold text-paper min-[901px]:block">
          Everything Marketing,
          <br />
          All in ONE PLACE
        </p>
      </section>

      <form
        action={action}
        className={`flex w-full flex-col gap-[22px] rounded-[25px] px-5 py-[26px] min-[621px]:rounded-[34px] min-[621px]:p-[clamp(34px,5vw,62px)] ${glass}`}
      >
        <input type="hidden" name="next" value={params.get("next") ?? "/overview"} />
        <div className="flex flex-col items-center pb-[18px]">
          <h1 className="text-[clamp(25px,3vw,34px)] font-bold text-paper">{adding ? "Add another account" : "Let’s start"}</h1>
          {adding && (
            <p className="mt-2 text-center text-xs text-paper/85">
              Sign in to your other business, or create a new account for it. You can switch between them from the
              account menu.
            </p>
          )}
        </div>
        <SavedAccounts backId={params.get("back")} />
        <AuthField label="Email" name="email" type="email" required autoComplete="email" defaultValue={state?.email ?? params.get("email") ?? undefined} />
        <PasswordField label="Password" name="password" required autoComplete="current-password" />
        <AuthCheck name="remember" label="Remember Me" />
        <PrimaryButton type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Log in"}
        </PrimaryButton>
        <FormMessage error>{error}</FormMessage>
        <div className="mt-3 flex flex-col items-start gap-4 min-[621px]:flex-row min-[621px]:justify-between">
          <AuthLink href="/signup">Create Account</AuthLink>
          <AuthLink href="/forgot-password" accent>
            Forgot Your Password
          </AuthLink>
        </div>
      </form>
    </div>
  );
}
