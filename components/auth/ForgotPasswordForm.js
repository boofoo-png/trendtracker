"use client";

// Forgot password screen from the Figma Make app (ForgotPasswordPage), wired to
// Supabase: "Send reset link" emails a link that opens /reset-password.

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import RecoveryCard from "./RecoveryCard";
import { AuthField, FormMessage, PrimaryButton, SecondaryButton } from "./ui";

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  const sent = state?.sent;

  return (
    <RecoveryCard
      action={action}
      icon={sent ? "email" : "settings"}
      eyebrow="Account recovery"
      title={sent ? "Check your inbox" : "Forgot your password?"}
      description={
        sent
          ? `If ${state.email} has an account, we sent password reset instructions to it. The link works once and expires after an hour.`
          : "Enter the email address connected to your account and we’ll send you a secure reset link."
      }
    >
      {/* Kept (hidden) after sending so "Resend email" posts the same address. */}
      <div hidden={sent}>
        <AuthField label="Email address" name="email" type="email" required autoComplete="email" floating defaultValue={state?.email} />
      </div>
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : sent ? "Resend email" : "Send reset link"}
      </PrimaryButton>
      <SecondaryButton href="/login" className="w-full">
        Back to login
      </SecondaryButton>
      <FormMessage error>{state?.error}</FormMessage>
    </RecoveryCard>
  );
}
