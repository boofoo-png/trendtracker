import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Set a new password · SixthSense",
};

// Needs the short-lived session from the reset link; proxy.js sends anyone
// without one to /login.
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
