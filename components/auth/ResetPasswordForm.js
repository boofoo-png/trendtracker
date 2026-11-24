"use client";

// Opened from the password reset email (via /auth/confirm, which signs the user in
// for this one step). Not in the Figma Make app; styled like its recovery card.

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";
import RecoveryCard from "./RecoveryCard";
import { FormMessage, PasswordField, PrimaryButton } from "./ui";

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);

  return (
    <RecoveryCard
      action={action}
      icon="settings"
      eyebrow="Account recovery"
      title="Set a new password"
      description="Choose a new password for your account. You’ll stay signed in and go straight to your workspace."
    >
      <PasswordField
        label="New password"
        name="password"
        floating
        required
        minLength={8}
        autoComplete="new-password"
        error={state?.field === "password"}
        helper={state?.field === "password" ? state.error : "At least 8 characters"}
      />
      <PasswordField
        label="Re-type password"
        name="confirm"
        floating
        required
        autoComplete="new-password"
        error={state?.field === "confirm"}
        helper={state?.field === "confirm" ? state.error : undefined}
      />
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save new password"}
      </PrimaryButton>
      <FormMessage error>{!state?.field && state?.error}</FormMessage>
    </RecoveryCard>
  );
}
