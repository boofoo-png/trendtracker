"use client";

// Create Account screen from the Figma Make app (CreateAccountPage). The Make
// version also asks for a street address, city, province, country and postal code;
// those are left out because nothing in the app uses them and there's nowhere to
// store them yet.

import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";
import { AuthField, FormMessage, PasswordField, PrimaryButton, SecondaryButton, glass } from "./ui";

const sectionTitle = "text-[clamp(19px,2.4vw,25px)] leading-[1.334] font-medium text-paper";

export default function SignupForm() {
  const [state, action, pending] = useActionState(signUp, null);
  const missing = new Set(state?.missing ?? []);
  const field = (name) => ({ name, defaultValue: state?.[name], error: missing.has(name), floating: true });

  if (state?.sent) {
    return (
      <div className={`grid w-full max-w-[560px] gap-[15px] rounded-[18px] p-[clamp(25px,5vw,42px)] text-paper ${glass}`}>
        <h1 className="text-[clamp(27px,4vw,38px)] leading-[1.15] tracking-[-0.025em]">Check your inbox</h1>
        <p className="mb-[7px] text-sm leading-[1.6]">
          We sent a link to <strong>{state.email}</strong>. Open it to confirm your account, then you’ll go straight to your workspace.
        </p>
        <SecondaryButton href="/login" className="w-full">
          Back to login
        </SecondaryButton>
      </div>
    );
  }

  return (
    <form action={action} noValidate className={`m-auto w-full max-w-[1080px] rounded-[25px] px-5 py-[26px] min-[621px]:rounded-[32px] min-[621px]:p-[clamp(30px,5vw,55px)] ${glass}`}>
      <h1 className="mb-7 text-[clamp(29px,4vw,40px)] leading-[1.334] font-medium text-paper min-[761px]:mb-[42px]">Create an Account</h1>
      <div className="grid gap-x-[18px] gap-y-5 min-[761px]:grid-cols-2">
        <AuthField label="First name" required autoComplete="given-name" maxLength={40} {...field("firstName")} />
        <AuthField label="Last name" required autoComplete="family-name" maxLength={40} {...field("lastName")} />
        <AuthField label="Role at company" required autoComplete="organization-title" maxLength={80} {...field("role")} />
      </div>

      <section className="mt-[38px] flex flex-col gap-5">
        <h2 className={sectionTitle}>Company Information</h2>
        <AuthField label="Company name" autoComplete="organization" maxLength={80} {...field("company")} />
        <div className="grid gap-x-[18px] gap-y-5 min-[761px]:grid-cols-2">
          <AuthField label="Email" type="email" required autoComplete="email" helper="Will be used for login" {...field("email")} />
          <AuthField label="Phone number" type="tel" required autoComplete="tel" maxLength={40} {...field("phone")} />
        </div>
      </section>

      <section className="mt-[38px] flex w-full max-w-[624px] flex-col gap-5">
        <h2 className={sectionTitle}>Password</h2>
        <PasswordField
          label="Create a password"
          name="password"
          floating
          autoComplete="new-password"
          minLength={8}
          error={state?.field === "password"}
          helper={state?.field === "password" ? state.error : "At least 8 characters"}
        />
        <PasswordField
          label="Re-type password"
          name="confirm"
          floating
          autoComplete="new-password"
          error={state?.field === "confirm"}
          helper={state?.field === "confirm" ? state.error : undefined}
        />
      </section>

      <div className="mt-[42px] flex flex-col gap-[17px] min-[481px]:flex-row">
        <PrimaryButton type="submit" disabled={pending} className="w-full min-[481px]:w-auto">
          {pending ? "Creating account…" : "Continue"}
        </PrimaryButton>
        <SecondaryButton href="/login" className="w-full min-[481px]:w-auto">
          Back
        </SecondaryButton>
      </div>
      {state?.error && !state.field && (
        <div className="mt-5">
          <FormMessage error>{state.error}</FormMessage>
        </div>
      )}
    </form>
  );
}
