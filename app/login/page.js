import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log in · SixthSense",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center p-5 min-[621px]:p-[clamp(28px,5vw,70px)]">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
